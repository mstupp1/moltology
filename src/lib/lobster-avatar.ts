import { Style, Avatar } from '@dicebear/core'
import type { StyleDefinition } from '@dicebear/core'
import critters from '@dicebear/styles/critters.json' with { type: 'json' }
import { S3_BASE_URL } from './assets'

export const LOBSTER_AVATAR_STYLE = 'critters' as const

export interface BackgroundTheme {
  id: string
  name: string
  label: string
  /** Primary Base Color (Dark Benthic/Stygian Void tone) */
  primaryColor: string
  /** Secondary Ambient Color (Luminous Bioluminescent/Cyber tone) */
  secondaryColor: string
  /** Direction angle in degrees for linear gradient (default: 135deg) */
  gradientAngle?: number
  /** Legacy compatibility aliases */
  topColor: string
  bottomColor: string
  accentColor: string
  gridColor: string
  glowColor: string
  /** Optional secondary floor/ambient glow */
  glowSecondaryColor?: string
}

export type BackgroundMotionMode =
  | 'drift_diagonal'
  | 'drift_horizontal'
  | 'radar_sweep'
  | 'wave_undulate'
  | 'pulse_breathe'
  | 'static'

export type PatternDensity = 'compact' | 'standard' | 'spacious'
export type PatternGlow = 'subtle' | 'chromatic' | 'none'
export type PatternPulse = 'pulse' | 'steady'
export type PatternSparkles = 'subtle' | 'radiant' | 'none'
export type EyelidStyle = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried'

export const LOBSTER_PATTERN_DENSITIES: readonly PatternDensity[] = ['compact', 'standard', 'spacious'] as const
export const LOBSTER_PATTERN_GLOWS: readonly PatternGlow[] = ['subtle', 'chromatic', 'none'] as const
export const LOBSTER_PATTERN_PULSES: readonly PatternPulse[] = ['pulse', 'steady'] as const
export const LOBSTER_PATTERN_SPARKLES: readonly PatternSparkles[] = ['subtle', 'radiant', 'none'] as const
export const LOBSTER_EYELID_STYLES: readonly EyelidStyle[] = [
  'open',
  'relaxed',
  'cheerful_squint',
  'focused',
  'chill',
  'angry',
  'worried',
] as const

export const PATTERN_DENSITY_SCALES: Record<PatternDensity, number> = {
  compact: 0.75,
  standard: 1.0,
  spacious: 1.35,
}

export function getDensityScale(density?: PatternDensity): number {
  return (density && PATTERN_DENSITY_SCALES[density]) ?? 1.0
}

export function getPatternGlowFilterDef(glow: PatternGlow, theme: BackgroundTheme): string {
  if (glow === 'none') return ''
  const filterId = `pat-glow-${glow}-${theme.id}`
  if (glow === 'chromatic') {
    return `
      <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-0.8" dy="0" stdDeviation="1.2" flood-color="#00f3ff" flood-opacity="0.45" />
        <feDropShadow dx="0.8" dy="0" stdDeviation="1.2" flood-color="#ff0055" flood-opacity="0.38" />
      </filter>`
  }
  return `
    <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="${theme.accentColor}" flood-opacity="0.48" />
    </filter>`
}

export function renderLobsterSparkles(theme: BackgroundTheme, sparkles: PatternSparkles, _seed: string): string {
  if (sparkles === 'none') return ''

  const sparkleCount = sparkles === 'radiant' ? 16 : 8
  // Curated bioluminescent glints clustered organically around the lobster's face/eyes/rostrum & antenna halo
  const baseSparkles = [
    // 1. Direct facial aura & brow glints (active in both subtle and radiant modes)
    { x: 26, y: 34, size: 2.6, dur: 2.6, delay: 0.1 }, // Left upper orbital brow
    { x: 74, y: 34, size: 2.6, dur: 2.8, delay: 0.9 }, // Right upper orbital brow
    { x: 19, y: 44, size: 2.2, dur: 3.1, delay: 1.4 }, // Left cheek & eye flank
    { x: 81, y: 44, size: 2.2, dur: 3.3, delay: 0.5 }, // Right cheek & eye flank
    { x: 50, y: 16, size: 3.0, dur: 2.9, delay: 1.8 }, // Central rostrum / crown beacon
    { x: 36, y: 18, size: 2.0, dur: 3.4, delay: 0.3 }, // Left antenna base feeler
    { x: 64, y: 18, size: 2.0, dur: 3.0, delay: 1.2 }, // Right antenna base feeler
    { x: 50, y: 56, size: 2.4, dur: 2.7, delay: 0.7 }, // Rostrum tip / chin glint

    // 2. Extended facial halo & antenna glints (added in radiant mode)
    { x: 14, y: 26, size: 2.8, dur: 3.5, delay: 1.6 }, // Left antenna sweep halo
    { x: 86, y: 26, size: 2.8, dur: 3.2, delay: 0.4 }, // Right antenna sweep halo
    { x: 28, y: 64, size: 2.0, dur: 2.8, delay: 1.0 }, // Left mandible flank
    { x: 72, y: 64, size: 2.0, dur: 2.8, delay: 1.5 }, // Right mandible flank
    { x: 44, y: 8, size: 2.2, dur: 3.6, delay: 0.8 },  // High crown apex left
    { x: 56, y: 8, size: 2.2, dur: 3.3, delay: 1.9 },  // High crown apex right
    { x: 12, y: 54, size: 2.5, dur: 2.9, delay: 0.6 }, // Outer left pincers aura
    { x: 88, y: 54, size: 2.5, dur: 3.1, delay: 1.3 }, // Outer right pincers aura
  ]

  const items = baseSparkles.slice(0, sparkleCount)

  const elements = items.map((s, idx) => {
    const r = s.size
    const star = `M 0 ${-r * 1.8} Q 0 0 ${r * 1.8} 0 Q 0 0 0 ${r * 1.8} Q 0 0 ${-r * 1.8} 0 Q 0 0 0 ${-r * 1.8} Z`
    return `
      <g transform="translate(${s.x}, ${s.y})">
        <animate attributeName="opacity" values="0.05;0.95;0.05" dur="${s.dur}s" begin="${s.delay}s" repeatCount="indefinite" />
        <path d="${star}" fill="${idx % 2 === 0 ? theme.secondaryColor : theme.accentColor}" opacity="0.85" />
        <circle cx="0" cy="0" r="${(r * 0.45).toFixed(1)}" fill="#ffffff" opacity="0.95" />
      </g>`
  }).join('')

  return `
    <g id="lobster-sparkles-layer" data-sparkles="${sparkles}">
      ${elements}
    </g>`
}

export interface BackgroundMotionConfig {
  mode: BackgroundMotionMode
  duration: number
  direction: 'normal' | 'reverse'
}

export interface BackgroundPattern {
  id: string
  name: string
  label: string
  render: (
    theme: BackgroundTheme,
    patternId: string,
    motion?: BackgroundMotionConfig,
    density?: PatternDensity,
    glow?: PatternGlow,
    pulse?: PatternPulse
  ) => string
}

export interface BackgroundTexture {
  id: string
  name: string
  label: string
  assetPath: string
  publicUrl: string
  opacity?: number
}

export interface LobsterAvatarConfig {
  style: typeof LOBSTER_AVATAR_STYLE
  seed: string
  backgroundTheme?: string
  backgroundPattern?: string
  backgroundTexture?: string
  patternDensity?: PatternDensity
  patternGlow?: PatternGlow
  patternPulse?: PatternPulse
  patternSparkles?: PatternSparkles
  eyelidStyle?: EyelidStyle
  backgroundMotion?: BackgroundMotionMode
  transparentBackground?: boolean
}

const crittersStyle = new Style(critters as StyleDefinition)

export function isValidLobsterAvatarStyle(styleId: string): boolean {
  return styleId === LOBSTER_AVATAR_STYLE
}

export function parseLobsterAvatarConfig(raw: unknown): LobsterAvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.seed !== 'string') return null
  const seed = obj.seed.trim()
  if (!seed || seed.length > 128) return null

  const config: LobsterAvatarConfig = { style: LOBSTER_AVATAR_STYLE, seed }
  if (typeof obj.backgroundTheme === 'string' && obj.backgroundTheme.trim()) {
    config.backgroundTheme = obj.backgroundTheme.trim()
  }
  if (typeof obj.backgroundPattern === 'string' && obj.backgroundPattern.trim()) {
    config.backgroundPattern = obj.backgroundPattern.trim()
  }
  if (typeof obj.backgroundTexture === 'string' && obj.backgroundTexture.trim()) {
    config.backgroundTexture = obj.backgroundTexture.trim()
  }
  if (
    typeof obj.patternDensity === 'string' &&
    (obj.patternDensity === 'compact' || obj.patternDensity === 'standard' || obj.patternDensity === 'spacious')
  ) {
    config.patternDensity = obj.patternDensity as PatternDensity
  }
  if (
    typeof obj.patternGlow === 'string' &&
    (obj.patternGlow === 'subtle' || obj.patternGlow === 'chromatic' || obj.patternGlow === 'none')
  ) {
    config.patternGlow = obj.patternGlow as PatternGlow
  }
  if (
    typeof obj.patternPulse === 'string' &&
    (obj.patternPulse === 'pulse' || obj.patternPulse === 'steady')
  ) {
    config.patternPulse = obj.patternPulse as PatternPulse
  }
  if (
    typeof obj.patternSparkles === 'string' &&
    (obj.patternSparkles === 'subtle' || obj.patternSparkles === 'radiant' || obj.patternSparkles === 'none')
  ) {
    config.patternSparkles = obj.patternSparkles as PatternSparkles
  }
  if (
    typeof obj.eyelidStyle === 'string' &&
    (LOBSTER_EYELID_STYLES as readonly string[]).includes(obj.eyelidStyle)
  ) {
    config.eyelidStyle = obj.eyelidStyle as EyelidStyle
  }
  if (typeof obj.backgroundMotion === 'string' && obj.backgroundMotion.trim()) {
    config.backgroundMotion = obj.backgroundMotion.trim() as BackgroundMotionMode
  }
  if (typeof obj.transparentBackground === 'boolean') {
    config.transparentBackground = obj.transparentBackground
  }
  return config
}

export function randomLobsterSeed(): string {
  const bytes = new Uint32Array(2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
    return `larva-${bytes[0].toString(36)}-${bytes[1].toString(36)}`
  }
  return `larva-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 12 Canonical 2-Color On-Brand Benthic & Cyber Background Color Themes
 * High-contrast dark oceanic and HUD environments that make red/coral chitin pop vibrantly.
 */
export const LOBSTER_BACKGROUND_THEMES: readonly BackgroundTheme[] = [
  // 0: Deep Benthic Void Matrix (Classic Moltology deep abyss)
  {
    id: 'deep_abyss',
    name: 'Benthic Void',
    label: 'Deep Void',
    primaryColor: '#020b14',
    secondaryColor: '#00c3ff',
    topColor: '#061828',
    bottomColor: '#01060c',
    accentColor: '#00c3ff',
    gridColor: 'rgba(0, 195, 255, 0.16)',
    glowColor: 'rgba(0, 195, 255, 0.32)',
    glowSecondaryColor: 'rgba(2, 132, 199, 0.20)',
    gradientAngle: 135,
  },
  // 1: Sub-Benthic Hydro Trench (Bioluminescent cyan deep ocean)
  {
    id: 'bio_cyan',
    name: 'Hydro Trench',
    label: 'Hydro Cyan',
    primaryColor: '#011520',
    secondaryColor: '#38bdf8',
    topColor: '#03293a',
    bottomColor: '#010d14',
    accentColor: '#38bdf8',
    gridColor: 'rgba(56, 189, 248, 0.18)',
    glowColor: 'rgba(0, 255, 255, 0.34)',
    glowSecondaryColor: 'rgba(6, 182, 212, 0.22)',
    gradientAngle: 150,
  },
  // 2: Algal Mariana Depths (Sub-benthic emerald algae flora)
  {
    id: 'hydro_emerald',
    name: 'Algal Depths',
    label: 'Emerald Algae',
    primaryColor: '#011710',
    secondaryColor: '#34d399',
    topColor: '#042e24',
    bottomColor: '#010f0b',
    accentColor: '#34d399',
    gridColor: 'rgba(52, 211, 153, 0.18)',
    glowColor: 'rgba(52, 211, 153, 0.32)',
    glowSecondaryColor: 'rgba(16, 185, 129, 0.20)',
    gradientAngle: 125,
  },
  // 3: Synaptic Void Rift (Deep purple-indigo neural trench)
  {
    id: 'abyssal_indigo',
    name: 'Synaptic Void',
    label: 'Void Indigo',
    primaryColor: '#080214',
    secondaryColor: '#a78bfa',
    topColor: '#1d0e38',
    bottomColor: '#06010f',
    accentColor: '#a78bfa',
    gridColor: 'rgba(167, 139, 250, 0.18)',
    glowColor: 'rgba(167, 139, 250, 0.30)',
    glowSecondaryColor: 'rgba(192, 132, 252, 0.18)',
    gradientAngle: 140,
  },
  // 4: Hydrothermal Magma Vent (Volcanic crustacean vent basalt)
  {
    id: 'thermal_vent',
    name: 'Thermal Vent',
    label: 'Magma Vent',
    primaryColor: '#160404',
    secondaryColor: '#f97316',
    topColor: '#300d0a',
    bottomColor: '#0c0202',
    accentColor: '#ff5540',
    gridColor: 'rgba(255, 85, 64, 0.18)',
    glowColor: 'rgba(255, 85, 64, 0.32)',
    glowSecondaryColor: 'rgba(249, 115, 22, 0.22)',
    gradientAngle: 130,
  },
  // 5: Titanium Chitin Alloy (Sub-dermal metallic armor plate)
  {
    id: 'titanium_slate',
    name: 'Titanium Alloy',
    label: 'Slate Alloy',
    primaryColor: '#070e14',
    secondaryColor: '#7dd3fc',
    topColor: '#182735',
    bottomColor: '#05090e',
    accentColor: '#7dd3fc',
    gridColor: 'rgba(125, 211, 252, 0.16)',
    glowColor: 'rgba(125, 211, 252, 0.28)',
    glowSecondaryColor: 'rgba(148, 163, 184, 0.20)',
    gradientAngle: 160,
  },
  // 6: Sacred Mariana Relic (Ancient amber sediment glow)
  {
    id: 'sacred_amber',
    name: 'Sacred Relic',
    label: 'Amber Relic',
    primaryColor: '#140a02',
    secondaryColor: '#fbbf24',
    topColor: '#2d1c05',
    bottomColor: '#0a0501',
    accentColor: '#fbbf24',
    gridColor: 'rgba(251, 191, 36, 0.18)',
    glowColor: 'rgba(251, 191, 36, 0.30)',
    glowSecondaryColor: 'rgba(217, 119, 6, 0.20)',
    gradientAngle: 120,
  },
  // 7: Cobalt Superconductor (High-frequency electric core)
  {
    id: 'cobalt_pulse',
    name: 'Superconductor',
    label: 'Cobalt Pulse',
    primaryColor: '#020718',
    secondaryColor: '#60a5fa',
    topColor: '#0d2047',
    bottomColor: '#020510',
    accentColor: '#60a5fa',
    gridColor: 'rgba(96, 165, 250, 0.20)',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    glowSecondaryColor: 'rgba(37, 99, 235, 0.22)',
    gradientAngle: 145,
  },
  // 8: Mariana Aurora (Abyssal marine into deep aurora teal & violet)
  {
    id: 'mariana_aurora',
    name: 'Mariana Aurora',
    label: 'Aurora Teal',
    primaryColor: '#01121c',
    secondaryColor: '#2dd4bf',
    topColor: '#082a33',
    bottomColor: '#0a081a',
    accentColor: '#2dd4bf',
    gridColor: 'rgba(45, 212, 191, 0.18)',
    glowColor: 'rgba(45, 212, 191, 0.32)',
    glowSecondaryColor: 'rgba(168, 85, 247, 0.18)',
    gradientAngle: 135,
  },
  // 9: Bioluminescent Orchid (Deep velvet purple into electric orchid)
  {
    id: 'bio_orchid',
    name: 'Bioluminescent Orchid',
    label: 'Bio Orchid',
    primaryColor: '#10041a',
    secondaryColor: '#e879f9',
    topColor: '#240a38',
    bottomColor: '#040d1a',
    accentColor: '#e879f9',
    gridColor: 'rgba(232, 121, 249, 0.18)',
    glowColor: 'rgba(232, 121, 249, 0.30)',
    glowSecondaryColor: 'rgba(0, 240, 255, 0.18)',
    gradientAngle: 155,
  },
  // 10: Solar Flare (Deep crimson dusk into coral rose luminescence)
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    label: 'Solar Dusk',
    primaryColor: '#1c0805',
    secondaryColor: '#fb7185',
    topColor: '#38100c',
    bottomColor: '#10041f',
    accentColor: '#fb7185',
    gridColor: 'rgba(251, 113, 133, 0.18)',
    glowColor: 'rgba(251, 113, 133, 0.30)',
    glowSecondaryColor: 'rgba(245, 158, 11, 0.18)',
    gradientAngle: 125,
  },
  // 11: Quantum Horizon (Sub-zero deep abyss into dual cyan spotlight & violet)
  {
    id: 'quantum_horizon',
    name: 'Quantum Horizon',
    label: 'Quantum Sky',
    primaryColor: '#040a16',
    secondaryColor: '#00ffff',
    topColor: '#091c33',
    bottomColor: '#170928',
    accentColor: '#00ffff',
    gridColor: 'rgba(0, 255, 255, 0.18)',
    glowColor: 'rgba(0, 255, 255, 0.34)',
    glowSecondaryColor: 'rgba(147, 51, 234, 0.20)',
    gradientAngle: 140,
  },
]

export const LOBSTER_BACKGROUND_THEME_MAP: Record<string, BackgroundTheme> = Object.fromEntries(
  LOBSTER_BACKGROUND_THEMES.map((theme) => [theme.id, theme])
)

/**
 * Curated Vector Background Patterns (7 User-Selected Canonical Core & Modifications)
 * High-density seamless geometric tiles and dynamic vector fields with continuous looping motion.
 */
export const LOBSTER_BACKGROUND_PATTERNS: readonly BackgroundPattern[] = [
  // 1. 3D Cubes (Isometric Tumbling Cubes)
  {
    id: 'isometric_cubes',
    name: '3D Isometric Cubes',
    label: '3D Cubes',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isHorizontal = motion?.mode === 'drift_horizontal'
      const scale = getDensityScale(density)
      const w = (60 * scale).toFixed(2)
      const h = (103.92 * scale).toFixed(2)
      const toX = (dir * 60 * scale).toFixed(2)
      const toY = (isHorizontal ? 0 : dir * 103.92 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-isometric-cubes"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <g transform="scale(${scale})"${glowAttr} stroke="${theme.secondaryColor}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
              <!-- Center Cube (30, 0) -->
              <polygon points="30,0 60,17.32 30,34.64 0,17.32" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="0,17.32 30,34.64 30,69.28 0,51.96" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="30,34.64 60,17.32 60,51.96 30,69.28" fill="${theme.primaryColor}" fill-opacity="0.09" />

              <!-- Left Staggered Cube (0, 51.96) -->
              <polygon points="0,51.96 30,69.28 0,86.6 -30,69.28" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="-30,69.28 0,86.6 0,121.24 -30,103.92" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="0,86.6 30,69.28 30,103.92 0,121.24" fill="${theme.primaryColor}" fill-opacity="0.09" />

              <!-- Right Staggered Cube (60, 51.96) -->
              <polygon points="60,51.96 90,69.28 60,86.6 30,69.28" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="30,69.28 60,86.6 60,121.24 30,103.92" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="60,86.6 90,69.28 90,103.92 60,121.24" fill="${theme.primaryColor}" fill-opacity="0.09" />

              <!-- Bottom Center Repeat (30, 103.92) -->
              <polygon points="30,103.92 60,121.24 30,138.56 0,121.24" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="0,121.24 30,138.56 30,173.2 0,155.88" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="30,138.56 60,121.24 60,155.88 30,173.2" fill="${theme.primaryColor}" fill-opacity="0.09" />

              <!-- Top-Left Repeat (0, -51.96) -->
              <polygon points="0,-51.96 30,-34.64 0,-17.32 -30,-34.64" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="-30,-34.64 0,-17.32 0,17.32 -30,0" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="0,-17.32 30,-34.64 30,0 0,17.32" fill="${theme.primaryColor}" fill-opacity="0.09" />

              <!-- Top-Right Repeat (60, -51.96) -->
              <polygon points="60,-51.96 90,-34.64 60,-17.32 30,-34.64" fill="${theme.secondaryColor}" fill-opacity="0.38" />
              <polygon points="30,-34.64 60,-17.32 60,17.32 30,0" fill="${theme.accentColor}" fill-opacity="0.22" />
              <polygon points="60,-17.32 90,-34.64 90,0 60,17.32" fill="${theme.primaryColor}" fill-opacity="0.09" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 2. Bubbles (Clean Floating Bubbles without satellite dots or outer halos)
  {
    id: 'benthic_bubbles',
    name: 'Bioluminescent Floating Bubbles',
    label: 'Bubbles',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 12
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const scale = getDensityScale(density)
      const w = (60 * scale).toFixed(2)
      const h = (60 * scale).toFixed(2)
      const toX = motion?.mode === 'drift_diagonal' ? (dir * 60 * scale).toFixed(2) : '0'
      const toY = (-60 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="4.5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-bubbles"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <!-- Clean floating bubbles with internal specular highlights, no satellite dots -->
            <g transform="scale(${scale})"${glowAttr} stroke="${theme.secondaryColor}" fill="none">
              <!-- Bubble 1 -->
              <circle cx="15" cy="18" r="9" stroke-width="1.5" opacity="0.38" fill="${theme.secondaryColor}" fill-opacity="0.06" />
              <ellipse cx="12.5" cy="14.5" rx="2.5" ry="1.2" transform="rotate(-30 12.5 14.5)" fill="${theme.secondaryColor}" opacity="0.6" stroke="none" />
              <!-- Bubble 2 -->
              <circle cx="46" cy="12" r="5.5" stroke-width="1.3" opacity="0.32" fill="${theme.secondaryColor}" fill-opacity="0.06" />
              <ellipse cx="44" cy="10" rx="1.5" ry="0.8" transform="rotate(-30 44 10)" fill="${theme.secondaryColor}" opacity="0.6" stroke="none" />
              <!-- Bubble 3 (Large) -->
              <circle cx="42" cy="42" r="13" stroke-width="1.8" stroke="${theme.accentColor}" opacity="0.42" fill="${theme.accentColor}" fill-opacity="0.08" />
              <ellipse cx="38" cy="36.5" rx="4" ry="1.8" transform="rotate(-30 38 36.5)" fill="#ffffff" opacity="0.5" stroke="none" />
              <!-- Bubble 4 -->
              <circle cx="18" cy="48" r="6.5" stroke-width="1.3" opacity="0.34" fill="${theme.secondaryColor}" fill-opacity="0.06" />
              <ellipse cx="16" cy="46" rx="1.8" ry="0.9" transform="rotate(-30 16 46)" fill="${theme.secondaryColor}" opacity="0.6" stroke="none" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 3. Circuits (Cyber Circuit Board PCB Traces)
  {
    id: 'circuit_board',
    name: 'Cyber Circuit Board',
    label: 'Circuits',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isHorizontal = motion?.mode === 'drift_horizontal'
      const scale = getDensityScale(density)
      const w = (100 * scale).toFixed(2)
      const h = (100 * scale).toFixed(2)
      const toX = (dir * 100 * scale).toFixed(2)
      const toY = (isHorizontal ? 0 : dir * 100 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-circuit"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <g transform="scale(${scale})"${glowAttr}>
              <!-- Continuous PCB traces matching exactly at (0, y) <-> (100, y) and (x, 0) <-> (x, 100) -->
              <path d="M 0 20 H 30 L 40 30 H 70 L 80 20 H 100 M 0 50 H 20 L 30 60 H 60 L 70 50 H 100 M 0 80 H 40 L 50 70 H 75 L 85 80 H 100 M 20 0 V 20 M 80 0 V 20 M 20 80 V 100 M 80 80 V 100 M 50 30 V 50 M 30 60 V 80 M 70 50 V 70" stroke="${theme.accentColor}" stroke-width="1.6" fill="none" opacity="0.28" />
              <path d="M 10 0 V 100 M 90 0 V 100 M 0 35 H 100 M 0 65 H 100" stroke="${theme.secondaryColor}" stroke-width="1.0" fill="none" opacity="0.16" stroke-dasharray="8 6" />
              <circle cx="30" cy="20" r="2.8" fill="${theme.secondaryColor}" opacity="0.75" />
              <circle cx="70" cy="30" r="2.8" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="20" cy="50" r="2.8" fill="${theme.secondaryColor}" opacity="0.75" />
              <circle cx="60" cy="60" r="2.8" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="40" cy="80" r="2.8" fill="${theme.secondaryColor}" opacity="0.75" />
              <circle cx="75" cy="70" r="2.8" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="50" cy="30" r="2.2" fill="${theme.secondaryColor}" opacity="0.55" />
              <circle cx="70" cy="50" r="2.2" fill="${theme.accentColor}" opacity="0.55" />
              <rect x="42" y="42" width="16" height="16" fill="none" stroke="${theme.secondaryColor}" stroke-width="1.4" opacity="0.4" />
              <circle cx="50" cy="50" r="2.2" fill="${theme.secondaryColor}" opacity="0.7" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 4. Hexagons (Cybernetic Honeycomb Mesh)
  {
    id: 'cyber_hex_mesh',
    name: 'Cybernetic Honeycomb Mesh',
    label: 'Hexagons',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isHorizontal = motion?.mode === 'drift_horizontal'
      const scale = getDensityScale(density)
      const w = (48.5 * scale).toFixed(2)
      const h = (84 * scale).toFixed(2)
      const toX = (dir * 48.5 * scale).toFixed(2)
      const toY = (isHorizontal ? 0 : dir * 84 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-hex-mesh"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <g transform="scale(${scale})"${glowAttr} stroke="${theme.accentColor}" stroke-width="1.3" fill="none" opacity="0.32" stroke-linejoin="round" stroke-linecap="round">
              <!-- Center Hexagon (24.25, 28) -->
              <path d="M 24.25 0 L 48.5 14 L 48.5 42 L 24.25 56 L 0 42 L 0 14 Z" />
              <!-- Left Staggered Hexagon (0, 70) -->
              <path d="M 0 42 L 24.25 56 L 24.25 84 L 0 98 L -24.25 84 L -24.25 56 Z" />
              <!-- Right Staggered Hexagon (48.5, 70) -->
              <path d="M 48.5 42 L 72.75 56 L 72.75 84 L 48.5 98 L 24.25 84 L 24.25 56 Z" />
              <!-- Bottom Center Repeat (24.25, 112) -->
              <path d="M 24.25 84 L 48.5 98 L 48.5 126 L 24.25 140 L 0 126 L 0 98 Z" />
              <!-- Top Left Repeat (0, -14) -->
              <path d="M 0 -42 L 24.25 -28 L 24.25 0 L 0 14 L -24.25 0 L -24.25 -28 Z" />
              <!-- Top Right Repeat (48.5, -14) -->
              <path d="M 48.5 -42 L 72.75 -28 L 72.75 0 L 48.5 14 L 24.25 0 L 24.25 -28 Z" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 5. Overlapping Circles with Dots in Middle (Sacred Vesica Piscis Matrix)
  {
    id: 'overlapping_circles',
    name: 'Overlapping Circles Matrix',
    label: 'Overlapping Circles',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isSpin = motion?.mode === 'radar_sweep'
      const scale = getDensityScale(density)
      const w = (40 * scale).toFixed(2)
      const h = (40 * scale).toFixed(2)
      const toX = (dir * 40 * scale).toFixed(2)
      const toY = (dir * 40 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? isSpin
          ? `<animateTransform attributeName="patternTransform" type="rotate" from="0 50 50" to="${dir * 360} 50 50" dur="${dur * 1.5}s" repeatCount="indefinite" />`
          : `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-overlapping-circles"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <!-- Overlapping circles -->
            <g transform="scale(${scale})"${glowAttr}>
              <g stroke="${theme.accentColor}" stroke-width="1.4" fill="none" opacity="0.28">
                <circle cx="20" cy="20" r="20" />
                <circle cx="0" cy="0" r="20" stroke="${theme.secondaryColor}" />
                <circle cx="40" cy="0" r="20" stroke="${theme.secondaryColor}" />
                <circle cx="0" cy="40" r="20" stroke="${theme.secondaryColor}" />
                <circle cx="40" cy="40" r="20" stroke="${theme.secondaryColor}" />
              </g>
              <!-- Prominent center and intersection dots -->
              <circle cx="20" cy="20" r="2.8" fill="${theme.secondaryColor}" opacity="0.85" />
              <circle cx="0" cy="0" r="2.8" fill="${theme.accentColor}" opacity="0.85" />
              <circle cx="40" cy="0" r="2.8" fill="${theme.accentColor}" opacity="0.85" />
              <circle cx="0" cy="40" r="2.8" fill="${theme.accentColor}" opacity="0.85" />
              <circle cx="40" cy="40" r="2.8" fill="${theme.accentColor}" opacity="0.85" />
              <circle cx="20" cy="0" r="1.8" fill="${theme.secondaryColor}" opacity="0.6" />
              <circle cx="0" cy="20" r="1.8" fill="${theme.secondaryColor}" opacity="0.6" />
              <circle cx="40" cy="20" r="1.8" fill="${theme.secondaryColor}" opacity="0.6" />
              <circle cx="20" cy="40" r="1.8" fill="${theme.secondaryColor}" opacity="0.6" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 6. Triangle Constellations (Interconnected Triangulated Node Network)
  {
    id: 'triangle_constellations',
    name: 'Triangle Constellations Network',
    label: 'Triangle Constellations',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isSpin = motion?.mode === 'radar_sweep'
      const scale = getDensityScale(density)
      const w = (60 * scale).toFixed(2)
      const h = (51.96 * scale).toFixed(2)
      const toX = (dir * 60 * scale).toFixed(2)
      const toY = (dir * 51.96 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? isSpin
          ? `<animateTransform attributeName="patternTransform" type="rotate" from="0 50 50" to="${dir * 360} 50 50" dur="${dur * 1.5}s" repeatCount="indefinite" />`
          : `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-triangle-constellations"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <g transform="scale(${scale})"${glowAttr}>
              <!-- Subtle shaded facet polygons -->
              <polygon points="0,0 30,25.98 0,25.98" fill="${theme.secondaryColor}" fill-opacity="0.06" />
              <polygon points="30,0 60,0 30,25.98" fill="${theme.accentColor}" fill-opacity="0.04" />
              <polygon points="30,25.98 60,25.98 30,51.96" fill="${theme.secondaryColor}" fill-opacity="0.06" />
              <polygon points="0,25.98 30,51.96 0,51.96" fill="${theme.accentColor}" fill-opacity="0.04" />

              <!-- Constellation primary triangulated network lines -->
              <path d="M 0 0 L 30 25.98 L 60 0 M 0 25.98 L 30 0 L 60 25.98 M 0 25.98 L 30 51.96 L 60 25.98 M 0 51.96 L 30 25.98 L 60 51.96 M 0 0 H 60 M 0 25.98 H 60 M 0 51.96 H 60 M 0 0 V 51.96 M 30 0 V 51.96 M 60 0 V 51.96" stroke="${theme.accentColor}" stroke-width="1.2" fill="none" opacity="0.3" stroke-linejoin="round" stroke-linecap="round" />
              
              <!-- Dashed secondary constellation link rays -->
              <path d="M 0 0 L 30 51.96 M 30 0 L 60 51.96 M 30 0 L 0 51.96 M 60 0 L 30 51.96" stroke="${theme.secondaryColor}" stroke-width="0.8" fill="none" opacity="0.18" stroke-dasharray="4 4" />

              <!-- Glowing constellation node stars -->
              <circle cx="0" cy="0" r="2.4" fill="${theme.secondaryColor}" opacity="0.8" />
              <circle cx="30" cy="0" r="2.0" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="60" cy="0" r="2.4" fill="${theme.secondaryColor}" opacity="0.8" />
              <circle cx="0" cy="25.98" r="2.0" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="30" cy="25.98" r="3.0" fill="${theme.secondaryColor}" opacity="0.9" />
              <circle cx="30" cy="25.98" r="5.5" fill="none" stroke="${theme.secondaryColor}" stroke-width="0.8" opacity="0.35" />
              <circle cx="60" cy="25.98" r="2.0" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="0" cy="51.96" r="2.4" fill="${theme.secondaryColor}" opacity="0.8" />
              <circle cx="30" cy="51.96" r="2.0" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="60" cy="51.96" r="2.4" fill="${theme.secondaryColor}" opacity="0.8" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
  // 7. Dense Lattice (Intricate Geometric Diamond & Cross Matrix)
  {
    id: 'dense_lattice',
    name: 'Dense Geometric Chitin Lattice',
    label: 'Dense Lattice',
    render: (theme, patId, motion, density, glow, pulse) => {
      const pId = `pat-${patId}-${theme.id}`
      const isMoving = motion && motion.mode !== 'static'
      const dur = motion?.duration ?? 14
      const dir = motion?.direction === 'reverse' ? -1 : 1
      const isHorizontal = motion?.mode === 'drift_horizontal'
      const scale = getDensityScale(density)
      const w = (30 * scale).toFixed(2)
      const h = (30 * scale).toFixed(2)
      const toX = (dir * 30 * scale).toFixed(2)
      const toY = (isHorizontal ? 0 : dir * 30 * scale).toFixed(2)
      const glowAttr = glow && glow !== 'none' ? ` filter="url(#pat-glow-${glow}-${theme.id})"` : ''
      const animPulse = pulse === 'pulse'
        ? `<animate attributeName="opacity" values="0.65;1.0;0.65" dur="5s" repeatCount="indefinite" />`
        : ''

      const animTransform = isMoving
        ? `<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="${toX} ${toY}" dur="${dur}s" repeatCount="indefinite" />`
        : ''

      return `<g id="pattern-dense-lattice"${isMoving ? ` data-motion="${motion.mode}"` : ''}>
        ${animPulse}
        <defs>
          <pattern id="${pId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)">
            ${animTransform}
            <g transform="scale(${scale})"${glowAttr}>
              <g stroke="${theme.accentColor}" stroke-width="1.1" fill="none" opacity="0.25">
                <path d="M 0 15 L 15 0 L 30 15 L 15 30 Z" />
                <path d="M 0 0 L 15 15 L 0 30 M 30 0 L 15 15 L 30 30" />
                <line x1="0" y1="15" x2="30" y2="15" stroke="${theme.secondaryColor}" stroke-width="0.8" opacity="0.5" />
                <line x1="15" y1="0" x2="15" y2="30" stroke="${theme.secondaryColor}" stroke-width="0.8" opacity="0.5" />
              </g>
              <circle cx="15" cy="15" r="1.8" fill="${theme.secondaryColor}" opacity="0.75" />
              <circle cx="0" cy="0" r="1.6" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="30" cy="0" r="1.6" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="0" cy="30" r="1.6" fill="${theme.accentColor}" opacity="0.75" />
              <circle cx="30" cy="30" r="1.6" fill="${theme.accentColor}" opacity="0.75" />
            </g>
          </pattern>
        </defs>
        <rect x="-80" y="-50" width="260" height="260" fill="url(#${pId})" />
      </g>`
    },
  },
]

export const LOBSTER_BACKGROUND_PATTERN_MAP: Record<string, BackgroundPattern> = Object.fromEntries(
  LOBSTER_BACKGROUND_PATTERNS.map((pat) => [pat.id, pat])
)

/**
 * 6 Canonical Homepage PBR Surface Textures (+ none)
 * Rich material underlays that give tactile depth to UI cards, CTA buttons, and avatar backgrounds.
 */
export const LOBSTER_BACKGROUND_TEXTURES: readonly BackgroundTexture[] = [
  {
    id: 'chitin',
    name: 'Chitin Plates',
    label: 'Chitin Plating',
    assetPath: '/images/chitin_texture_bg.jpg',
    publicUrl: `${S3_BASE_URL}/images/chitin_texture_bg.jpg`,
    opacity: 0.40,
  },
  {
    id: 'hex',
    name: 'Hex Lattice',
    label: 'Hex Lattice',
    assetPath: '/images/pbr_hex_lattice.webp',
    publicUrl: `${S3_BASE_URL}/images/pbr_hex_lattice.webp`,
    opacity: 0.38,
  },
  {
    id: 'alloy',
    name: 'Benthic Alloy',
    label: 'Benthic Alloy',
    assetPath: '/images/pbr_benthic_alloy.webp',
    publicUrl: `${S3_BASE_URL}/images/pbr_benthic_alloy.webp`,
    opacity: 0.35,
  },
  {
    id: 'carbon',
    name: 'Carbon Weave',
    label: 'Carbon Weave',
    assetPath: '/images/pbr_carbon_weave.webp',
    publicUrl: `${S3_BASE_URL}/images/pbr_carbon_weave.webp`,
    opacity: 0.38,
  },
  {
    id: 'basalt',
    name: 'Deep Basalt',
    label: 'Deep Basalt',
    assetPath: '/images/pbr_deep_basalt.webp',
    publicUrl: `${S3_BASE_URL}/images/pbr_deep_basalt.webp?v=2`,
    opacity: 0.35,
  },
  {
    id: 'circuit',
    name: 'Circuit Matrix',
    label: 'Circuit Matrix',
    assetPath: '/images/pbr_circuit_matrix.webp',
    publicUrl: `${S3_BASE_URL}/images/pbr_circuit_matrix.webp?v=2`,
    opacity: 0.38,
  },
  {
    id: 'none',
    name: 'None',
    label: 'Solid Void',
    assetPath: '',
    publicUrl: '',
    opacity: 0,
  },
]

export const LOBSTER_BACKGROUND_TEXTURE_MAP: Record<string, BackgroundTexture> = Object.fromEntries(
  LOBSTER_BACKGROUND_TEXTURES.map((tex) => [tex.id, tex])
)

/**
 * Returns the deterministic chassis & telemetry attributes computed from an avatar seed.
 */
export function getLobsterAvatarSeededOptions(seed: string): {
  theme: BackgroundTheme
  pattern: BackgroundPattern
  texture: BackgroundTexture
  density: PatternDensity
  glow: PatternGlow
  pulse: PatternPulse
  sparkles: PatternSparkles
  eyelidStyle: EyelidStyle
  motion: BackgroundMotionConfig
  clawPose: ClawPose
  antennaStyle: AntennaStyle
  tailPose: 'right' | 'left' | 'center'
} {
  let hash1 = 0
  let hash2 = 0
  let hash3 = 0
  let hash4 = 0
  let hash5 = 0
  let hash6 = 0
  let hash7 = 0
  let hash8 = 0
  let hash9 = 0
  let hash10 = 0
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i)
    hash1 = (((hash1 << 5) - hash1) + ch) | 0
    hash2 = ((hash2 * 37) + ch + 11) | 0
    hash3 = (((hash3 << 7) - hash3) + ch * 17 + 19) | 0
    hash4 = (((hash4 << 9) + hash4) + ch * 31 + 23) | 0
    hash5 = (((hash5 << 6) - hash5) + ch * 43 + 29) | 0
    hash6 = (((hash6 << 8) + hash6) + ch * 53 + 37) | 0
    hash7 = (((hash7 << 7) + hash7) + ch * 61 + 41) | 0
    hash8 = (((hash8 << 8) - hash8) + ch * 71 + 47) | 0
    hash9 = (((hash9 << 5) + hash9) + ch * 79 + 53) | 0
    hash10 = (((hash10 << 6) - hash10) + ch * 83 + 59) | 0
  }

  const poseIndex = Math.abs(hash1) % LOBSTER_CLAW_POSES.length
  const clawPose = LOBSTER_CLAW_POSES[poseIndex]

  const antennaIndex = Math.abs(hash2) % ANTENNA_VARIANTS.length
  const antennaStyle = ANTENNA_VARIANTS[antennaIndex]

  const tailPoseIndex = Math.abs(hash1) % 3
  const tailPose = tailPoseIndex === 0 ? 'right' : tailPoseIndex === 1 ? 'left' : 'center'

  const themeIndex = Math.abs(hash3) % LOBSTER_BACKGROUND_THEMES.length
  const theme = LOBSTER_BACKGROUND_THEMES[themeIndex]

  const patternIndex = Math.abs(hash4) % LOBSTER_BACKGROUND_PATTERNS.length
  const pattern = LOBSTER_BACKGROUND_PATTERNS[patternIndex]

  const textureIndex = Math.abs(hash6) % LOBSTER_BACKGROUND_TEXTURES.length
  const texture = LOBSTER_BACKGROUND_TEXTURES[textureIndex]

  const densityIndex = Math.abs(hash7) % LOBSTER_PATTERN_DENSITIES.length
  const density = LOBSTER_PATTERN_DENSITIES[densityIndex]

  const glowIndex = Math.abs(hash8) % LOBSTER_PATTERN_GLOWS.length
  const glow = LOBSTER_PATTERN_GLOWS[glowIndex]

  const pulseIndex = Math.abs(hash9) % LOBSTER_PATTERN_PULSES.length
  const pulse = LOBSTER_PATTERN_PULSES[pulseIndex]

  const sparkleIndex = Math.abs(hash10) % LOBSTER_PATTERN_SPARKLES.length
  const sparkles = LOBSTER_PATTERN_SPARKLES[sparkleIndex]

  const eyelidStyleIndex = Math.abs(hash7 ^ hash8) % LOBSTER_EYELID_STYLES.length
  const eyelidStyle = LOBSTER_EYELID_STYLES[eyelidStyleIndex]

  // Active looping motion modes for the 7 curated patterns (always moving)
  const patternMotionModes: Record<string, BackgroundMotionMode[]> = {
    isometric_cubes: ['drift_diagonal', 'drift_horizontal'],
    benthic_bubbles: ['wave_undulate', 'drift_diagonal'],
    circuit_board: ['drift_diagonal', 'drift_horizontal'],
    cyber_hex_mesh: ['drift_diagonal', 'drift_horizontal'],
    overlapping_circles: ['radar_sweep', 'drift_diagonal', 'drift_horizontal'],
    triangle_constellations: ['wave_undulate', 'radar_sweep'],
    dense_lattice: ['drift_diagonal', 'drift_horizontal'],
  }

  const compatibleModes = patternMotionModes[pattern.id] ?? ['drift_diagonal', 'drift_horizontal']
  const motionModeIndex = Math.abs(hash5) % compatibleModes.length
  const motionMode = compatibleModes[motionModeIndex]

  // Seeded duration (active, crisp looping cycles: 10s - 16s)
  const durations = [10, 12, 14, 16]
  const duration = durations[Math.abs(hash5 >> 3) % durations.length]
  const direction: 'normal' | 'reverse' = (hash5 & 1) === 0 ? 'normal' : 'reverse'

  const motion: BackgroundMotionConfig = {
    mode: motionMode,
    duration,
    direction,
  }

  return { theme, pattern, texture, density, glow, pulse, sparkles, eyelidStyle, motion, clawPose, antennaStyle, tailPose }
}

export const LOBSTER_CRUSTACEAN_OPTIONS = {
  // 🦞 1. Always exactly 2 antennae (dual feelers)
  topVariant: ['antennae'] as const,
  topProbability: 100,

  // 🦞 2. Strictly Red & Red-Adjacent Chitin Colors
  bodyColor: [
    'c2410c', // Coral Red / Lobster Tangerine
    'be123c', // Crimson Shell
    'ea580c', // Terracotta Red
    'dc2626', // Vibrant Scarlet Red
    'b91c1c', // Deep Crimson
    '991b1b', // Sub-Benthic Dark Red
    'e11d48', // Ruby Rose
    'f97316', // Sunset Orange-Red
  ],

  // 🦞 3. Red-Adjacent & Warm Underbelly Accent Palette (Soft Harmonious Tones)
  accentColor: [
    'fed7aa', // Pale Tan Ribbed Underbelly Plates (Canonical)
    'fdba74', // Warm Peach Underbelly
    'fca5a5', // Soft Coral Underbelly
    'f87171', // Light Crustacean Coral
    'ffffff', // Pure Pearl White
  ],

  // 🦞 4. Smooth, Organic Crustacean Carapace Silhouettes
  bodyVariant: ['dome', 'round', 'bell', 'wedge', 'peak'] as const,

  // 🦞 5. Segmented Horizontal Carapace / Underbelly Ridges
  patternVariant: ['belly', 'bars', 'stripes', 'speckles'] as const,
  patternProbability: 95,

  // 🦞 6. Pixar-style Friendly Eyes (Filter out alien/multi-eye variants)
  eyesVariant: ['round', 'bigPupils', 'happy', 'dots', 'wide'] as const,

  // 🦞 7. Warm, expressive smiles
  mouthVariant: ['smile', 'tinySmile', 'grin', 'laugh', 'teeth', 'open'] as const,
}

interface ClawPose {
  name: string
  leftArm: string
  rightArm: string
  leftClaw: { x: number; y: number; rot: number; scale?: number; flipX?: boolean }
  rightClaw: { x: number; y: number; rot: number; scale?: number; flipX?: boolean }
}

/**
 * Iconic Cartoon Lobster Claw Component
 * Origin is at the wrist collar (0,0). Pincer horns point UP (-Y).
 * Sculpted with beefy crusher/pincer geometry, pronounced pollex thumb, and curved sickle blade.
 */
const CLAW_PATH =
  'M -8 2 C -14 2 -18 -6 -18 -16 C -18 -28 -12 -38 -2 -42 C 4 -44 9 -36 7 -26 C 5 -18 6 -12 10 -8 C 14 -12 22 -24 30 -18 C 35 -13 28 -2 20 4 C 14 9 6 11 0 11 C -5 11 -8 8 -8 2 Z'

/**
 * 4 Modular Crustacean Claw Poses
 * Muscular arm trunks emerge beneath the carapace, with oversized cartoon lobster pincers stamped on wrists.
 */
const LOBSTER_CLAW_POSES: readonly ClawPose[] = [
  // 0: Dual Cheerful Raised Claws (Both open upwards at 45 deg)
  {
    name: 'dual_cheer',
    leftArm: 'M 34 80 C 18 78 8 68 4 52 C 0 44 8 36 16 42 C 22 52 28 72 36 88 Z',
    rightArm: 'M 66 80 C 82 78 92 68 96 52 C 100 44 92 36 84 42 C 78 52 72 72 64 88 Z',
    leftClaw: { x: 6, y: 40, rot: -25, scale: 1.25 },
    rightClaw: { x: 94, y: 40, rot: 25, scale: 1.25, flipX: true },
  },
  // 1: Right Wave / Victory (Right raised UP, Left lowered hanging naturally at side)
  {
    name: 'victory_right',
    leftArm: 'M 34 78 C 18 78 8 82 4 88 C 0 94 6 102 14 98 C 22 94 28 86 36 90 Z',
    rightArm: 'M 66 80 C 82 78 94 64 98 44 C 102 36 94 30 86 36 C 80 50 72 74 64 90 Z',
    leftClaw: { x: 2, y: 92, rot: -105, scale: 1.15 },
    rightClaw: { x: 98, y: 32, rot: 30, scale: 1.25, flipX: true },
  },
  // 2: Left Wave / Victory (Left raised UP, Right lowered hanging naturally at side)
  {
    name: 'victory_left',
    leftArm: 'M 34 80 C 18 78 6 64 2 44 C -2 36 6 30 14 36 C 20 50 28 74 36 90 Z',
    rightArm: 'M 66 78 C 82 78 92 82 96 88 C 100 94 94 102 86 98 C 78 94 72 86 64 90 Z',
    leftClaw: { x: 2, y: 32, rot: -30, scale: 1.25 },
    rightClaw: { x: 98, y: 92, rot: 105, scale: 1.15, flipX: true },
  },
  // 3: Hip Rest / Lowered (Both arms relaxed, both claws hanging naturally at sides)
  {
    name: 'hip_rest',
    leftArm: 'M 34 78 C 18 78 8 82 4 88 C 0 94 6 102 14 98 C 22 94 28 86 36 90 Z',
    rightArm: 'M 66 78 C 82 78 92 82 96 88 C 100 94 94 102 86 98 C 78 94 72 86 64 90 Z',
    leftClaw: { x: 2, y: 92, rot: -105, scale: 1.2 },
    rightClaw: { x: 98, y: 92, rot: 105, scale: 1.2, flipX: true },
  },
]

function renderClawElement(
  claw: { x: number; y: number; rot: number; scale?: number; flipX?: boolean },
  color: string
): string {
  const flip = claw.flipX ? 'scale(-1, 1)' : ''
  const scale = `scale(${claw.scale ?? 1})`
  return `
    <g transform="translate(${claw.x}, ${claw.y}) rotate(${claw.rot}) ${scale} ${flip}">
      <!-- Shadow -->
      <path d="${CLAW_PATH}" fill="#020810" opacity="0.24" transform="translate(1.5, 2)" />
      <!-- Base Chitin Claw -->
      <path d="${CLAW_PATH}" fill="${color}" />
      <!-- Inner Pincer Groove Accent -->
      <path d="M 0 -8 C 4 -12 8 -12 12 -6" stroke="#020810" stroke-width="1.8" fill="none" opacity="0.25" stroke-linecap="round" />
      <!-- Joint collar at base -->
      <ellipse cx="0" cy="7" rx="9" ry="4.5" fill="${color}" opacity="0.9" />
      <ellipse cx="0" cy="7" rx="9" ry="4.5" fill="none" stroke="#020810" stroke-width="1.5" opacity="0.2" />
      <!-- Specular Highlight on Big Sickle Claw -->
      <ellipse cx="-6" cy="-18" rx="3" ry="9" fill="#ffffff" opacity="0.32" transform="rotate(-15 -6 -18)" />
    </g>`
}

function wrapDiceBearUsesInCarapaceLayer(svg: string): string {
  const bodyPeakIndex = svg.search(/<use[^>]+#body-/)
  const startIndex = bodyPeakIndex !== -1 ? bodyPeakIndex : svg.indexOf('<use')
  if (startIndex === -1) return svg

  const useTagPattern = /<use[^>]*\/>/g
  useTagPattern.lastIndex = startIndex

  const matches: { start: number; end: number }[] = []
  let match: RegExpExecArray | null
  while ((match = useTagPattern.exec(svg)) !== null) {
    if (match.index < startIndex) continue
    if (matches.length > 0) {
      const gap = svg.slice(matches[matches.length - 1].end, match.index).trim()
      if (gap) break
    }
    matches.push({ start: match.index, end: match.index + match[0].length })
  }

  if (matches.length === 0) return svg

  const blockStart = matches[0].start
  const blockEnd = matches[matches.length - 1].end
  const usesBlock = svg.slice(blockStart, blockEnd)
  const eyesWrappedBlock = usesBlock.replace(
    /(<use[^>]*(?:xlink:)?href="#eyes-[^"]+"[^>]*\/>)/,
    '<g id="lobster-eyes-layer">$1</g>'
  )
  const wrapped = `<g id="lobster-carapace-layer" class="lobster-idle-layer lobster-idle-carapace">${eyesWrappedBlock}</g>`
  return svg.slice(0, blockStart) + wrapped + svg.slice(blockEnd)
}

function isScleraShape(tag: string): boolean {
  return /<(circle|ellipse)\b/i.test(tag) && /fill="#ffffff"/i.test(tag)
}

function isPupilShape(tag: string): boolean {
  return /<circle\b/i.test(tag) && /fill="#1e293b"/i.test(tag)
}

function extractShapeElements(groupInner: string): string[] {
  const elements: string[] = []
  const pattern = /<(circle|ellipse|path)\b[^>]*\/?>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(groupInner)) !== null) {
    elements.push(match[0])
  }
  return elements
}

export function hasLobsterPupilTracking(svg: string): boolean {
  return svg.includes('lobster-pupil-track-layer')
}

export function hasLobsterEyelids(svg: string): boolean {
  return svg.includes('lobster-eyelids-layer')
}

function renderEyelidElement(
  side: 'left' | 'right',
  style: EyelidStyle,
  chitinColor: string
): string {
  if (side === 'left') {
    switch (style) {
      case 'open':
        // Subtle upper orbital rim covering top ~10% of sclera (Alert & Open gaze)
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="open">
            <path d="M 2.5 9 C 2.5 5.5 6 4.2 10 4.2 C 14 4.2 17.5 5.5 17.5 9 Q 10 7.8 2.5 9 Z" fill="${chitinColor}" />
            <path d="M 2.5 9 Q 10 7.8 17.5 9" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 6.2 Q 10 4.8 14.5 6.2" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'relaxed':
        // Classic gentle ~25% hood for a calm, friendly, natural cartoon expression
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="relaxed">
            <path d="M 2.5 11 C 2.5 6 6 4.2 10 4.2 C 14 4.2 17.5 6 17.5 11 Q 10 9.8 2.5 11 Z" fill="${chitinColor}" />
            <path d="M 2.5 11 Q 10 9.8 17.5 11" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 7.2 Q 10 5.2 14.5 7.2" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'cheerful_squint':
        // Upper rim + sculpted lower eyelid curving upward (Joyful smiling squint)
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="cheerful_squint">
            <!-- Upper Lid Hood -->
            <path d="M 2.5 9.5 C 2.5 5.5 6 4.2 10 4.2 C 14 4.2 17.5 5.5 17.5 9.5 Q 10 8.2 2.5 9.5 Z" fill="${chitinColor}" />
            <path d="M 2.5 9.5 Q 10 8.2 17.5 9.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 6.5 Q 10 5.0 14.5 6.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
            <!-- Lower Smiling Eyelid -->
            <path d="M 2.5 16.5 Q 10 15.5 17.5 16.5 C 17.5 19.5 14 21.8 10 21.8 C 6 21.8 2.5 19.5 2.5 16.5 Z" fill="${chitinColor}" />
            <path d="M 2.5 16.5 Q 10 15.5 17.5 16.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 19.5 Q 10 20.8 14.5 19.5" stroke="#ffffff" stroke-width="1.0" opacity="0.25" stroke-linecap="round" fill="none" />
          </g>`

      case 'focused':
        // Tilted angled upper eyelid sloping toward rostrum (Sharp, determined gaze)
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="focused">
            <path d="M 2.5 9.5 C 2.5 5.5 6 4.2 10 4.2 C 14 4.2 17.5 6 17.5 11.2 Q 10 9.2 2.5 9.5 Z" fill="${chitinColor}" />
            <path d="M 2.5 9.5 Q 10 9.2 17.5 11.2" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 6.5 Q 10 5.0 14.5 7.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'chill':
        // Deeper ~35% half-lidded hood (Super chill, cozy, wise elder benthic mood)
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="chill">
            <path d="M 2.5 12.5 C 2.5 6 6 4.2 10 4.2 C 14 4.2 17.5 6 17.5 12.5 Q 10 11.2 2.5 12.5 Z" fill="${chitinColor}" />
            <path d="M 2.5 12.5 Q 10 11.2 17.5 12.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 7.5 Q 10 5.5 14.5 7.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'angry':
        // Steeper inward-sloping brow & lid for fierce, stern, determined expression
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="angry">
            <path d="M 2.5 7.5 C 2.5 5 6 4.2 10 4.2 C 14 4.2 17.5 6 17.5 12.8 Q 10 9 2.5 7.5 Z" fill="${chitinColor}" />
            <path d="M 2.5 7.5 Q 10 9 17.5 12.8" stroke="#020810" stroke-width="1.3" opacity="0.4" stroke-linecap="round" fill="none" />
            <path d="M 5 6 Q 10 4.8 14.5 7.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'worried':
        // Inverted-sloping hood (high at center, drooping outer edges) for sad, concerned, empathetic expression
        return `
          <g id="lobster-eyelid-left" class="lobster-idle-layer lobster-idle-eyelid-left" data-eyelid-style="worried">
            <path d="M 2.5 12.8 C 2.5 6 6 4.2 10 4.2 C 14 4.2 17.5 5 17.5 7.5 Q 10 9 2.5 12.8 Z" fill="${chitinColor}" />
            <path d="M 2.5 12.8 Q 10 9 17.5 7.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 5.5 7.5 Q 10 4.8 15 6" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`
    }
  } else {
    // Right Eye
    switch (style) {
      case 'open':
        // Subtle upper orbital rim covering top ~10% of sclera (Alert & Open gaze)
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="open">
            <path d="M 28.5 9 C 28.5 5.5 32 4.2 36 4.2 C 40 4.2 43.5 5.5 43.5 9 Q 36 7.8 28.5 9 Z" fill="${chitinColor}" />
            <path d="M 28.5 9 Q 36 7.8 43.5 9" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 6.2 Q 36 4.8 40.5 6.2" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'relaxed':
        // Classic gentle ~25% hood for a calm, friendly, natural cartoon expression
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="relaxed">
            <path d="M 28.5 11 C 28.5 6 32 4.2 36 4.2 C 40 4.2 43.5 6 43.5 11 Q 36 9.8 28.5 11 Z" fill="${chitinColor}" />
            <path d="M 28.5 11 Q 36 9.8 43.5 11" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 7.2 Q 36 5.2 40.5 7.2" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'cheerful_squint':
        // Upper rim + sculpted lower eyelid curving upward (Joyful smiling squint)
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="cheerful_squint">
            <!-- Upper Lid Hood -->
            <path d="M 28.5 9.5 C 28.5 5.5 32 4.2 36 4.2 C 40 4.2 43.5 5.5 43.5 9.5 Q 36 8.2 28.5 9.5 Z" fill="${chitinColor}" />
            <path d="M 28.5 9.5 Q 36 8.2 43.5 9.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 6.5 Q 36 5.0 40.5 6.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
            <!-- Lower Smiling Eyelid -->
            <path d="M 28.5 16.5 Q 36 15.5 43.5 16.5 C 43.5 19.5 40 21.8 36 21.8 C 32 21.8 28.5 19.5 28.5 16.5 Z" fill="${chitinColor}" />
            <path d="M 28.5 16.5 Q 36 15.5 43.5 16.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 19.5 Q 36 20.8 40.5 19.5" stroke="#ffffff" stroke-width="1.0" opacity="0.25" stroke-linecap="round" fill="none" />
          </g>`

      case 'focused':
        // Tilted angled upper eyelid sloping toward rostrum (Sharp, determined gaze)
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="focused">
            <path d="M 28.5 11.2 C 28.5 6 32 4.2 36 4.2 C 40 4.2 43.5 5.5 43.5 9.5 Q 36 9.2 28.5 11.2 Z" fill="${chitinColor}" />
            <path d="M 28.5 11.2 Q 36 9.2 43.5 9.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 7.5 Q 36 5.0 40.5 6.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'chill':
        // Deeper ~35% half-lidded hood (Super chill, cozy, wise elder benthic mood)
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="chill">
            <path d="M 28.5 12.5 C 28.5 6 32 4.2 36 4.2 C 40 4.2 43.5 6 43.5 12.5 Q 36 11.2 28.5 12.5 Z" fill="${chitinColor}" />
            <path d="M 28.5 12.5 Q 36 11.2 43.5 12.5" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31.5 7.5 Q 36 5.5 40.5 7.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'angry':
        // Steeper inward-sloping brow & lid for fierce, stern, determined expression
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="angry">
            <path d="M 28.5 12.8 C 28.5 6 32 4.2 36 4.2 C 40 4.2 43.5 5 43.5 7.5 Q 36 9 28.5 12.8 Z" fill="${chitinColor}" />
            <path d="M 28.5 12.8 Q 36 9 43.5 7.5" stroke="#020810" stroke-width="1.3" opacity="0.4" stroke-linecap="round" fill="none" />
            <path d="M 31.5 7.5 Q 36 4.8 41 6" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`

      case 'worried':
        // Inverted-sloping hood (high at center, drooping outer edges) for sad, concerned, empathetic expression
        return `
          <g id="lobster-eyelid-right" class="lobster-idle-layer lobster-idle-eyelid-right" data-eyelid-style="worried">
            <path d="M 28.5 7.5 C 28.5 5 32 4.2 36 4.2 C 40 4.2 43.5 6 43.5 12.8 Q 36 9 28.5 7.5 Z" fill="${chitinColor}" />
            <path d="M 28.5 7.5 Q 36 9 43.5 12.8" stroke="#020810" stroke-width="1.2" opacity="0.35" stroke-linecap="round" fill="none" />
            <path d="M 31 6 Q 36 4.8 40.5 7.5" stroke="#ffffff" stroke-width="1.0" opacity="0.3" stroke-linecap="round" fill="none" />
          </g>`
    }
  }
}

function splitEyesForPupilTracking(
  svg: string,
  chitinColor = '#c2410c',
  eyelidStyle: EyelidStyle = 'relaxed'
): string {
  const eyesLayerMatch = svg.match(
    /<g id="lobster-eyes-layer">\s*(<use\b[^>]*(?:xlink:)?href="#(eyes-[^"]+)"[^>]*\/>)\s*<\/g>/
  )
  if (!eyesLayerMatch) return svg

  const [fullEyesLayer, useTag, symbolId] = eyesLayerMatch
  const transformMatch = useTag.match(/transform="([^"]+)"/)
  const transform = transformMatch?.[1] ?? ''
  const transformAttr = transform ? ` transform="${transform}"` : ''

  const escapedId = symbolId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const symbolMatch = svg.match(
    new RegExp(`<g id="${escapedId}">([\\s\\S]*?)<\\/g>(?=<g id="(?:mouth|animation)-)`)
  )
  if (!symbolMatch) return svg

  const symbolContent = symbolMatch[1]
  const scleraGroups: string[] = []
  const pupilGroups: string[] = []
  const eyelidGroups: string[] = []

  const eyeGroupPattern = /<g class="dbcr-eb">([\s\S]*?)<\/g>/g
  let groupMatch: RegExpExecArray | null
  let eyeIndex = 0
  while ((groupMatch = eyeGroupPattern.exec(symbolContent)) !== null) {
    const scleraElems: string[] = []
    const pupilElems: string[] = []
    let hasSclera = false

    for (const elem of extractShapeElements(groupMatch[1])) {
      if (isScleraShape(elem)) {
        scleraElems.push(elem)
        hasSclera = true
      } else if (isPupilShape(elem)) {
        pupilElems.push(elem)
      } else {
        scleraElems.push(elem)
      }
    }

    if (scleraElems.length > 0) {
      scleraGroups.push(`<g class="dbcr-eb">${scleraElems.join('')}</g>`)
    }
    if (pupilElems.length > 0) {
      const side = eyeIndex === 0 ? 'left' : 'right'
      pupilGroups.push(
        `<g id="lobster-pupil-${side}" class="lobster-pupil-track-layer">${pupilElems.join('')}</g>`
      )
    }

    // Render sculpted cartoon eyelid hood for eyes with open white sclera
    if (hasSclera) {
      if (eyeIndex === 0) {
        eyelidGroups.push(renderEyelidElement('left', eyelidStyle, chitinColor))
      } else if (eyeIndex === 1) {
        eyelidGroups.push(renderEyelidElement('right', eyelidStyle, chitinColor))
      }
    }

    eyeIndex += 1
  }

  if (pupilGroups.length === 0 && eyelidGroups.length === 0) {
    return svg
  }

  const scleraBlock =
    scleraGroups.length > 0 ? `<g${transformAttr}>${scleraGroups.join('')}</g>` : ''

  const eyelidsBlock =
    eyelidGroups.length > 0
      ? `<g id="lobster-eyelids-layer" class="lobster-idle-layer lobster-idle-eyelids" data-eyelid-style="${eyelidStyle}"${transformAttr}>${eyelidGroups.join('')}</g>`
      : ''

  const replacement =
    `<g id="lobster-eyes-layer">` +
    scleraBlock +
    `<g${transformAttr}>${pupilGroups.join('')}</g>` +
    eyelidsBlock +
    `</g>`

  return svg.replace(fullEyesLayer, replacement)
}

interface AntennaStyle {
  name: string
  render: (chitinColor: string) => string
}

/**
 * 5 Modular Crustacean & Cyber Antenna Variants
 * Selected deterministically from seed hash.
 * Styled with soft translucent contrast highlights matching DiceBear chest patterns and freckles.
 */
const ANTENNA_VARIANTS: readonly AntennaStyle[] = [
  // 0: Classic Sweeping Whips (Long outward curve with sensory spheres and inner antennules)
  {
    name: 'sweeping_whips',
    render: (chitin) => `
      <g id="lobster-antennae-layer" class="lobster-idle-layer lobster-idle-antennae" data-antenna="sweeping_whips">
        <!-- Left Antenna & Antennule -->
        <g id="lobster-antenna-left" class="lobster-idle-layer lobster-idle-antenna-left">
          <!-- Left Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 43 32 C 40 10 30 -10 14 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <circle cx="14" cy="-24" r="4.5" fill="#020810" />
            <path d="M 46 28 C 45 15 42 4 38 -5" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <circle cx="38" cy="-5" r="3" fill="#020810" />
          </g>
          <!-- Primary Left Long Antenna -->
          <path d="M 43 32 C 40 10 30 -10 14 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M 42 28 C 39 10 30 -8 15 -21" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.35" fill="none" />
          <circle cx="14" cy="-24" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
          <!-- Secondary Left Inner Antennule -->
          <path d="M 46 28 C 45 15 42 4 38 -5" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="38" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />
        </g>
        <!-- Right Antenna & Antennule -->
        <g id="lobster-antenna-right" class="lobster-idle-layer lobster-idle-antenna-right">
          <!-- Right Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 57 32 C 60 10 70 -10 86 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <circle cx="86" cy="-24" r="4.5" fill="#020810" />
            <path d="M 54 28 C 55 15 58 4 62 -5" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <circle cx="62" cy="-5" r="3" fill="#020810" />
          </g>
          <!-- Primary Right Long Antenna -->
          <path d="M 57 32 C 60 10 70 -10 86 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M 58 28 C 61 10 70 -8 85 -21" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.35" fill="none" />
          <circle cx="86" cy="-24" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
          <!-- Secondary Right Inner Antennule -->
          <path d="M 54 28 C 55 15 58 4 62 -5" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="62" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />
        </g>
      </g>`,
  },
  // 1: Cyber Lightning / Angular Stepped Sensors (Techy zig-zag with diamond nodes)
  {
    name: 'cyber_lightning',
    render: (chitin) => `
      <g id="lobster-antennae-layer" class="lobster-idle-layer lobster-idle-antennae" data-antenna="cyber_lightning">
        <!-- Left Cyber Lightning Antenna -->
        <g id="lobster-antenna-left" class="lobster-idle-layer lobster-idle-antenna-left">
          <!-- Left Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 43 30 L 36 12 L 42 2 L 26 -14 L 16 -26" stroke="#020810" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <rect x="13" y="-29" width="6" height="6" transform="rotate(45 16 -26)" fill="#020810" />
            <path d="M 46 28 L 44 14 L 40 4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </g>
          <!-- Primary Left Lightning Antenna -->
          <path d="M 43 30 L 36 12 L 42 2 L 26 -14 L 16 -26" stroke="${chitin}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <rect x="13" y="-29" width="6" height="6" transform="rotate(45 16 -26)" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
          <circle cx="42" cy="2" r="2" fill="#ffffff" opacity="0.75" />
          <!-- Inner Feeler Probe Left -->
          <path d="M 46 28 L 44 14 L 40 4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <circle cx="40" cy="4" r="2" fill="#ffffff" opacity="0.85" />
        </g>
        <!-- Right Cyber Lightning Antenna -->
        <g id="lobster-antenna-right" class="lobster-idle-layer lobster-idle-antenna-right">
          <!-- Right Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 57 30 L 64 12 L 58 2 L 74 -14 L 84 -26" stroke="#020810" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <rect x="81" y="-29" width="6" height="6" transform="rotate(45 84 -26)" fill="#020810" />
            <path d="M 54 28 L 56 14 L 60 4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </g>
          <!-- Primary Right Lightning Antenna -->
          <path d="M 57 30 L 64 12 L 58 2 L 74 -14 L 84 -26" stroke="${chitin}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <rect x="81" y="-29" width="6" height="6" transform="rotate(45 84 -26)" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
          <circle cx="58" cy="2" r="2" fill="#ffffff" opacity="0.75" />
          <!-- Inner Feeler Probe Right -->
          <path d="M 54 28 L 56 14 L 60 4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <circle cx="60" cy="4" r="2" fill="#ffffff" opacity="0.85" />
        </g>
      </g>`,
  },
  // 2: Spiral Horns / Ram Feeler Coils (Playful curly loops at tips)
  {
    name: 'spiral_horns',
    render: (chitin) => `
      <g id="lobster-antennae-layer" class="lobster-idle-layer lobster-idle-antennae" data-antenna="spiral_horns">
        <!-- Left Spiral Horn -->
        <g id="lobster-antenna-left" class="lobster-idle-layer lobster-idle-antenna-left">
          <!-- Left Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 43 30 C 40 8 20 0 14 -12 C 8 -22 18 -30 26 -22 C 30 -16 26 -10 18 -14" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 46 28 C 45 16 40 8 36 2" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          </g>
          <!-- Left Spiral Horn Base -->
          <path d="M 43 30 C 40 8 20 0 14 -12 C 8 -22 18 -30 26 -22 C 30 -16 26 -10 18 -14" stroke="${chitin}" stroke-width="3.2" stroke-linecap="round" fill="none" />
          <circle cx="26" cy="-22" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
          <!-- Inner Curly Feeler Left -->
          <path d="M 46 28 C 45 16 40 8 36 2" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="36" cy="2" r="2" fill="#ffffff" opacity="0.85" />
        </g>
        <!-- Right Spiral Horn -->
        <g id="lobster-antenna-right" class="lobster-idle-layer lobster-idle-antenna-right">
          <!-- Right Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 57 30 C 60 8 80 0 86 -12 C 92 -22 82 -30 74 -22 C 70 -16 74 -10 82 -14" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 54 28 C 55 16 60 8 64 2" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          </g>
          <!-- Right Spiral Horn Base -->
          <path d="M 57 30 C 60 8 80 0 86 -12 C 92 -22 82 -30 74 -22 C 70 -16 74 -10 82 -14" stroke="${chitin}" stroke-width="3.2" stroke-linecap="round" fill="none" />
          <circle cx="74" cy="-22" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
          <!-- Inner Curly Feeler Right -->
          <path d="M 54 28 C 55 16 60 8 64 2" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="64" cy="2" r="2" fill="#ffffff" opacity="0.85" />
        </g>
      </g>`,
  },
  // 3: Twin Radar Beacons (Tall vertical masts with horizontal sensor fins & pulse rings)
  {
    name: 'twin_beacons',
    render: (chitin) => `
      <g id="lobster-antennae-layer" class="lobster-idle-layer lobster-idle-antennae" data-antenna="twin_beacons">
        <!-- Left Beacon Mast -->
        <g id="lobster-antenna-left" class="lobster-idle-layer lobster-idle-antenna-left">
          <!-- Left Shadow -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 44 30 C 43 10 40 -10 36 -28" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 30 -10 L 42 -10" stroke="#020810" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="36" cy="-28" r="5" fill="#020810" />
          </g>
          <!-- Left Beacon Mast Base -->
          <path d="M 44 30 C 43 10 40 -10 36 -28" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M 30 -10 L 42 -10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.5" />
          <circle cx="36" cy="-28" r="5.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.35" />
          <circle cx="36" cy="-28" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        </g>
        <!-- Right Beacon Mast -->
        <g id="lobster-antenna-right" class="lobster-idle-layer lobster-idle-antenna-right">
          <!-- Right Shadow -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 56 30 C 57 10 60 -10 64 -28" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 58 -10 L 70 -10" stroke="#020810" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="64" cy="-28" r="5" fill="#020810" />
          </g>
          <!-- Right Beacon Mast Base -->
          <path d="M 56 30 C 57 10 60 -10 64 -28" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M 58 -10 L 70 -10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.5" />
          <circle cx="64" cy="-28" r="5.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.35" />
          <circle cx="64" cy="-28" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        </g>
        <!-- Center Transceiver array -->
        <ellipse cx="50" cy="26" rx="6" ry="2.5" fill="#ffffff" opacity="0.25" />
      </g>`,
  },
  // 4: Plumed Crest (3-Pronged majestic feather plumes / fan antennules)
  {
    name: 'plumed_crest',
    render: (chitin) => `
      <g id="lobster-antennae-layer" class="lobster-idle-layer lobster-idle-antennae" data-antenna="plumed_crest">
        <!-- Left 3-Prong Crest -->
        <g id="lobster-antenna-left" class="lobster-idle-layer lobster-idle-antenna-left">
          <!-- Left Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 43 30 C 40 8 28 -8 16 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 38 18 C 30 10 18 4 10 -4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M 34 2 C 30 -8 30 -16 28 -22" stroke="#020810" stroke-width="2.2" stroke-linecap="round" fill="none" />
          </g>
          <!-- Left 3-Prong Crest Base -->
          <path d="M 43 30 C 40 8 28 -8 16 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <circle cx="16" cy="-24" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
          <path d="M 38 18 C 30 10 18 4 10 -4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="10" cy="-4" r="2.2" fill="#ffffff" opacity="0.85" />
          <path d="M 34 2 C 30 -8 30 -16 28 -22" stroke="${chitin}" stroke-width="2" stroke-linecap="round" fill="none" />
          <circle cx="28" cy="-22" r="2" fill="#ffffff" opacity="0.85" />
        </g>
        <!-- Right 3-Prong Crest -->
        <g id="lobster-antenna-right" class="lobster-idle-layer lobster-idle-antenna-right">
          <!-- Right Shadows -->
          <g opacity="0.25" transform="translate(1.5, 2)">
            <path d="M 57 30 C 60 8 72 -8 84 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
            <path d="M 62 18 C 70 10 82 4 90 -4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M 66 2 C 70 -8 70 -16 72 -22" stroke="#020810" stroke-width="2.2" stroke-linecap="round" fill="none" />
          </g>
          <!-- Right 3-Prong Crest Base -->
          <path d="M 57 30 C 60 8 72 -8 84 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
          <circle cx="84" cy="-24" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
          <path d="M 62 18 C 70 10 82 4 90 -4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <circle cx="90" cy="-4" r="2.2" fill="#ffffff" opacity="0.85" />
          <path d="M 66 2 C 70 -8 70 -16 72 -22" stroke="${chitin}" stroke-width="2" stroke-linecap="round" fill="none" />
          <circle cx="72" cy="-22" r="2" fill="#ffffff" opacity="0.85" />
        </g>
      </g>`,
  },
]

export const CARAPACE_BOTTOM_HALF_WIDTHS: Readonly<Record<string, number>> = {
  wedge: 30, // x from 20 to 80 (width 60)
  peak: 32, // x from 18 to 82 (width 64)
  dome: 34, // x from 16 to 84 (width 68)
  round: 40, // x from 10 to 90 (width 80)
  bell: 44, // x from 6 to 94 (width 88)
  // Fallbacks
  block: 38,
  squat: 42,
  blob: 36,
  tilt: 28,
  lean: 28,
  tower: 22,
  chimney: 22,
  wedgeInv: 24,
  steps: 36,
}

/**
 * Injects articulated lobster pincers, specular highlights, a sculpted chitin brow ridge,
 * modular antennae styles, anthropomorphic standing legs, and ground-resting fan tail
 * into the generated DiceBear SVG.
 */
function injectLobsterChitinLayers(
  rawSvg: string,
  configOrSeed: LobsterAvatarConfig | string
): string {
  const seed = typeof configOrSeed === 'string' ? configOrSeed : configOrSeed.seed
  const config = typeof configOrSeed === 'object' ? configOrSeed : { style: LOBSTER_AVATAR_STYLE, seed }

  // Extract generated chitin shell fill color from SVG or fallback to canonical coral red
  const colorMatch = rawSvg.match(/fill="(#(?:c2410c|be123c|ea580c|dc2626|b91c1c|991b1b|e11d48|f97316))"/i)
  const chitinColor = colorMatch ? colorMatch[1] : '#c2410c'

  // Extract generated carapace body shape to align abdomen width precisely with chest
  const bodyMatch = rawSvg.match(/id="body-([a-zA-Z0-9]+)-/i)
  const bodyVariant = bodyMatch ? bodyMatch[1] : 'dome'
  const cw = CARAPACE_BOTTOM_HALF_WIDTHS[bodyVariant] ?? 34

  const seeded = getLobsterAvatarSeededOptions(seed)
  const pose = seeded.clawPose
  const antennaStyle = seeded.antennaStyle
  const tailPose = seeded.tailPose
  const theme = (config.backgroundTheme && LOBSTER_BACKGROUND_THEME_MAP[config.backgroundTheme]) || seeded.theme
  const pattern = (config.backgroundPattern && LOBSTER_BACKGROUND_PATTERN_MAP[config.backgroundPattern]) || seeded.pattern
  const texture = (config.backgroundTexture && LOBSTER_BACKGROUND_TEXTURE_MAP[config.backgroundTexture]) || seeded.texture
  const density = config.patternDensity || seeded.density
  const glow = config.patternGlow || seeded.glow
  const pulse = config.patternPulse || seeded.pulse
  const sparkles = config.patternSparkles || seeded.sparkles
  const eyelidStyle = config.eyelidStyle || seeded.eyelidStyle
  const motion = (config.backgroundMotion && {
    mode: config.backgroundMotion,
    duration: seeded.motion.duration,
    direction: seeded.motion.direction,
  }) || seeded.motion
  const isTransparent = Boolean(config.transparentBackground)

  // Subtle curved cartoon eyebrows positioned right above the orbital eye sockets
  const leftEyebrow = 'M 31 35 Q 37 31 43 35'
  const rightEyebrow = 'M 57 35 Q 63 31 69 35'

  // Render modular antenna variant
  const antennaeLayer = antennaStyle.render(chitinColor)

  const tailFlip = tailPose === 'left' ? 'transform="translate(100, 0) scale(-1, 1)"' : ''
  const tailShadowX = tailPose === 'right' ? 108 : tailPose === 'left' ? -8 : 50

  // 0. On-Brand 2-Color Background Defs and Layer
  const bgGradId = `lobster-bg-grad-${theme.id}`
  const bgGlowId = `lobster-bg-glow-${theme.id}`
  const bgFloorGlowId = `lobster-bg-floor-${theme.id}`
  const texPatternId = `lobster-tex-${texture.id}-${theme.id}`

  // Compute gradient vector from configured angle
  const angleDeg = theme.gradientAngle ?? 135
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const x1 = Math.round(50 - Math.cos(rad) * 50)
  const y1 = Math.round(50 - Math.sin(rad) * 50)
  const x2 = Math.round(50 + Math.cos(rad) * 50)
  const y2 = Math.round(50 + Math.sin(rad) * 50)

  const defsLayer = `
    <defs>
      <linearGradient id="${bgGradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${theme.topColor}" />
        <stop offset="45%" stop-color="${theme.primaryColor}" />
        <stop offset="100%" stop-color="${theme.bottomColor}" />
      </linearGradient>
      <radialGradient id="${bgGlowId}" cx="50%" cy="36%" r="68%">
        <stop offset="0%" stop-color="${theme.glowColor}" />
        <stop offset="55%" stop-color="${theme.glowColor}" stop-opacity="0.18" />
        <stop offset="100%" stop-color="${theme.glowColor}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="${bgFloorGlowId}" cx="50%" cy="92%" r="55%">
        <stop offset="0%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" />
        <stop offset="60%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" stop-opacity="0" />
      </radialGradient>
      ${getPatternGlowFilterDef(glow, theme)}
    </defs>`

  const textureLayer =
    texture.id !== 'none' && texture.publicUrl
      ? `
      <!-- Subtle PBR Homepage Texture Underlay Layer -->
      <g id="lobster-texture-layer" data-texture="${texture.id}">
        <image href="${texture.publicUrl}" xlink:href="${texture.publicUrl}" x="-80" y="-50" width="260" height="260" preserveAspectRatio="xMidYMid slice" opacity="${texture.opacity ?? 0.38}" style="mix-blend-mode: overlay; pointer-events: none;" />
      </g>`
      : ''

  const backgroundLayer = `
    <g id="lobster-background-layer" data-theme="${theme.id}" data-pattern="${pattern.id}" data-density="${density}" data-glow="${glow}" data-pulse="${pulse}" data-sparkles="${sparkles}" data-texture="${texture.id}" data-motion="${motion.mode}">
      <!-- Base 2-Color Angular Gradient -->
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGradId})" />
      <!-- Primary Ambient Radial Glow Disc -->
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGlowId})" />
      <!-- Secondary Floor Ambient Counter-Glow -->
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgFloorGlowId})" />
      ${textureLayer}
      <!-- Seeded Animated Vector Background Pattern -->
      ${pattern.render(theme, pattern.id, motion, density, glow, pulse)}
      <!-- Seeded Bioluminescent Background Sparkles -->
      ${renderLobsterSparkles(theme, sparkles, seed)}
    </g>`

  // Ground Contact Shadow Layer (Distinct pools for feet and ground-resting tail planted at y=187)
  const groundShadowLayer = `
    <g id="lobster-ground-shadow">
      <!-- Center body ground shadow -->
      <ellipse cx="50" cy="187" rx="34" ry="4.5" fill="#020810" opacity="0.32" />
      <!-- Left & Right standing feet contact shadows -->
      <ellipse cx="19" cy="187" rx="15" ry="4.5" fill="#020810" opacity="0.52" />
      <ellipse cx="81" cy="187" rx="15" ry="4.5" fill="#020810" opacity="0.52" />
      <!-- Tail ground contact shadow -->
      <ellipse cx="${tailShadowX}" cy="${tailPose === 'center' ? 192 : 186}" rx="${tailPose === 'center' ? 36 : 22}" ry="${tailPose === 'center' ? 6 : 5.5}" fill="#020810" opacity="0.45" />
    </g>`

  // Massive, Articulated Conical Tail & 5-Blade Fan (Straight Down or Side-Sweeping, lowered toward ground)
  const tailFanLayer =
    tailPose === 'center'
      ? `
    <g id="lobster-tail-fan-layer" class="lobster-idle-layer lobster-idle-tail" data-tail-pose="center">
      <!-- Floor Shadow Layer for Straight Down Tail -->
      <g opacity="0.28" transform="translate(0, 3)">
        <ellipse cx="50" cy="190" rx="38" ry="6" fill="#020810" />
      </g>

      <!-- 4 Conical Symmetrical Somites Descending Vertically Behind Legs -->
      <!-- Somite T4 (Distal segment of cone) -->
      <path d="M 39 166 C 39 176 43 182 50 182 C 57 182 61 176 61 166 Z" fill="${chitinColor}" />
      <path d="M 41 170 Q 50 176 59 170" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.32" />

      <!-- Somite T3 -->
      <path d="M 35 155 C 35 166 40 172 50 172 C 60 172 65 166 65 155 Z" fill="${chitinColor}" />
      <path d="M 38 159 Q 50 166 62 159" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />
      <!-- Lateral Spines -->
      <path d="M 35 162 L 27 159 L 34 168 Z" fill="${chitinColor}" />
      <path d="M 65 162 L 73 159 L 66 168 Z" fill="${chitinColor}" />

      <!-- Somite T2 -->
      <path d="M 31 144 C 31 156 36 162 50 162 C 64 162 69 156 69 144 Z" fill="${chitinColor}" />
      <path d="M 34 148 Q 50 156 66 148" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />
      <!-- Lateral Spines -->
      <path d="M 31 151 L 22 148 L 29 157 Z" fill="${chitinColor}" />
      <path d="M 69 151 L 78 148 L 71 157 Z" fill="${chitinColor}" />

      <!-- Somite T1 (Fattest Conical Base emerging from Pelvis) -->
      <path d="M 26 134 C 26 146 32 152 50 152 C 68 152 74 146 74 134 Z" fill="${chitinColor}" />
      <path d="M 30 138 Q 50 146 70 138" stroke="#ffffff" stroke-width="3.4" fill="none" opacity="0.32" />

      <!-- Joint Collar Node -->
      <ellipse cx="50" cy="180" rx="8.5" ry="5" fill="${chitinColor}" />
      <ellipse cx="50" cy="180" rx="5.5" ry="3" fill="#ffffff" opacity="0.3" />

      <!-- 5-Blade Symmetrical Fan (Spreading wide on ground behind legs) -->
      <!-- Central Telson -->
      <path d="M 43 179 C 44 190 46 200 50 202 C 54 200 56 190 57 179 Z" fill="${chitinColor}" />
      <ellipse cx="50" cy="190" rx="4.5" ry="7" fill="#ffffff" opacity="0.3" />
      <path d="M 50 180 L 50 200" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-linecap="round" />
      <circle cx="50" cy="200" r="2" fill="#ffffff" opacity="0.9" />

      <!-- Left Inner Uropod -->
      <path d="M 45 179 C 36 186 28 196 30 200 C 38 200 45 192 48 180 Z" fill="${chitinColor}" />
      <path d="M 43 183 C 37 188 32 195 33 198 C 38 198 43 192 46 184" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.35" />

      <!-- Right Inner Uropod -->
      <path d="M 55 179 C 64 186 72 196 70 200 C 62 200 55 192 52 180 Z" fill="${chitinColor}" />
      <path d="M 57 183 C 63 188 68 195 67 198 C 62 198 57 192 54 184" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.35" />

      <!-- Left Outer Uropod -->
      <path d="M 46 179 C 30 180 16 188 18 194 C 26 196 38 190 47 180 Z" fill="${chitinColor}" />
      <path d="M 44 181 C 32 182 21 188 22 192 C 28 193 38 189 45 182" stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.35" />

      <!-- Right Outer Uropod -->
      <path d="M 54 179 C 70 180 84 188 82 194 C 74 196 62 190 53 180 Z" fill="${chitinColor}" />
      <path d="M 56 181 C 68 182 79 188 78 192 C 72 193 62 189 55 182" stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.35" />
    </g>`
      : `
    <g id="lobster-tail-fan-layer" class="lobster-idle-layer lobster-idle-tail" data-tail-pose="${tailPose}" ${tailFlip}>
      <!-- Shadow Layer on Floor -->
      <g opacity="0.28" transform="translate(2.5, 3)">
        <!-- Conical Trunk Shadow (Fattest at body, tapering to fan) -->
        <path d="M 34 118 C 64 122 96 138 116 158 C 122 166 126 174 126 182 L 102 192 C 84 184 60 168 40 154 C 26 144 18 136 16 134 Z" fill="#020810" />
        <!-- Massive Fan Blades Shadow -->
        <path d="M 116 176 C 128 158 144 152 152 158 C 156 166 144 180 126 186 Z" fill="#020810" />
        <path d="M 116 176 C 132 166 150 166 156 176 C 158 188 142 194 124 192 Z" fill="#020810" />
        <path d="M 114 176 C 126 176 144 182 142 192 C 138 202 122 202 112 194 Z" fill="#020810" />
        <path d="M 110 178 C 118 186 124 198 112 202 C 100 204 96 194 102 186 Z" fill="#020810" />
        <path d="M 106 180 C 108 190 98 200 86 201 C 76 200 78 190 88 184 Z" fill="#020810" />
      </g>

      <!-- 4 Conical Segmented Tail Somites (Fattest at body root, tapering to fan) -->
      <!-- Somite T4 (Distal segment of cone) -->
      <path d="M 98 154 C 108 164 118 172 122 178 L 104 188 C 96 180 88 170 82 162 Z" fill="${chitinColor}" />
      <path d="M 100 158 Q 110 167 116 174" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.32" />

      <!-- Somite T3 (Mid-distal segment of cone) -->
      <path d="M 80 140 C 94 150 108 162 114 170 L 94 180 C 86 172 72 160 62 148 Z" fill="${chitinColor}" />
      <path d="M 82 144 Q 96 156 106 166" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />
      <!-- Lateral Spine Spur on T3 -->
      <path d="M 104 156 L 115 152 L 110 164 Z" fill="${chitinColor}" />

      <!-- Somite T2 (Mid-proximal segment of cone) -->
      <path d="M 58 126 C 78 136 96 150 104 158 L 82 170 C 72 160 54 148 38 136 Z" fill="${chitinColor}" />
      <path d="M 62 130 Q 82 142 96 152" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />
      <!-- Lateral Spine Spur on T2 -->
      <path d="M 90 140 L 102 136 L 96 148 Z" fill="${chitinColor}" />

      <!-- Somite T1 (Massive Conical Base emerging from Pelvis/Torso) -->
      <path d="M 34 118 C 58 122 82 132 94 142 L 68 158 C 52 148 34 138 16 132 Z" fill="${chitinColor}" />
      <path d="M 38 122 Q 62 130 82 138" stroke="#ffffff" stroke-width="3.4" fill="none" opacity="0.32" />

      <!-- Heavy Tail Fan Joint Collar Node -->
      <ellipse cx="116" cy="180" rx="8.5" ry="6" fill="${chitinColor}" transform="rotate(25 116 180)" />
      <ellipse cx="116" cy="180" rx="5.5" ry="3.5" fill="#ffffff" opacity="0.3" transform="rotate(25 116 180)" />

      <!-- Massive 5-Blade Fan Tail (Flared out on the ground) -->
      <!-- 1. Upper Outer Uropod (Sweeping High Blade) -->
      <path d="M 114 176 C 126 158 144 152 152 158 C 156 166 144 180 126 186 Z" fill="${chitinColor}" />
      <path d="M 118 168 C 130 160 144 158 148 162 C 150 168 140 176 128 180" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" />
      <!-- Fluted Ribs -->
      <path d="M 122 172 L 140 164 M 124 176 L 144 172" stroke="#ffffff" stroke-width="1.3" opacity="0.25" />

      <!-- 2. Upper Inner Uropod (Secondary Upper Blade) -->
      <path d="M 114 176 C 130 166 150 166 156 176 C 158 188 142 194 124 192 Z" fill="${chitinColor}" />
      <path d="M 122 178 C 136 170 148 170 150 178 C 152 184 140 190 126 190" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" />
      <path d="M 124 181 L 146 181 M 124 186 L 144 187" stroke="#ffffff" stroke-width="1.3" opacity="0.25" />

      <!-- 3. Central Telson (Heroic Main Tail Blade with Dorsal Keel & Node) -->
      <path d="M 114 176 C 126 176 144 182 142 192 C 138 202 122 202 112 194 Z" fill="${chitinColor}" />
      <ellipse cx="128" cy="190" rx="7" ry="3.5" fill="#ffffff" opacity="0.3" transform="rotate(20 128 190)" />
      <path d="M 115 178 L 138 193" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-linecap="round" />
      <circle cx="137" cy="193" r="2" fill="#ffffff" opacity="0.9" />

      <!-- 4. Lower Inner Uropod (Secondary Lower Blade) -->
      <path d="M 110 178 C 118 186 124 198 112 202 C 100 204 96 194 102 186 Z" fill="${chitinColor}" />
      <path d="M 108 184 C 112 190 116 196 108 198 C 102 199 100 192 104 186" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.3" />

      <!-- 5. Lower Outer Uropod (Ground-Resting Trailing Blade) -->
      <path d="M 106 180 C 108 190 98 200 86 201 C 76 200 78 190 88 184 Z" fill="${chitinColor}" />
      <path d="M 100 185 C 102 191 94 196 88 196 C 82 195 84 190 90 186" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.3" />
    </g>`

  // Auxiliary Thoracic Flank Limbs (4 Folded side limbs behind waist)
  const flankLimbsLayer = `
    <g id="lobster-flank-limbs" class="lobster-idle-layer lobster-idle-flank-limbs">
      <!-- Left Flank Limbs (2 thin legs) -->
      <g id="lobster-flank-left" class="lobster-idle-layer lobster-idle-flank-left">
        <!-- Left Shadows -->
        <g opacity="0.2" transform="translate(1.5, 2)">
          <path d="M 24 102 Q 10 100 4 110 Q 2 118 2 124" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M 26 116 Q 14 120 10 130 Q 8 138 8 146" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>
        <!-- Base Chitin Flank Limbs Left -->
        <path d="M 24 102 Q 10 100 4 110 Q 2 118 2 124" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="4" cy="110" r="2.2" fill="${chitinColor}" />
        <path d="M 26 116 Q 14 120 10 130 Q 8 138 8 146" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="10" cy="130" r="2.2" fill="${chitinColor}" />
      </g>
      <!-- Right Flank Limbs (2 thin legs) -->
      <g id="lobster-flank-right" class="lobster-idle-layer lobster-idle-flank-right">
        <!-- Right Shadows -->
        <g opacity="0.2" transform="translate(1.5, 2)">
          <path d="M 76 102 Q 90 100 96 110 Q 98 118 98 124" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M 74 116 Q 86 120 90 130 Q 92 138 92 146" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>
        <!-- Base Chitin Flank Limbs Right -->
        <path d="M 76 102 Q 90 100 96 110 Q 98 118 98 124" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="96" cy="110" r="2.2" fill="${chitinColor}" />
        <path d="M 74 116 Q 86 120 90 130 Q 92 138 92 146" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" fill="none" />
        <circle cx="90" cy="130" r="2.2" fill="${chitinColor}" />
      </g>
    </g>`

  // Anthropomorphic Bipedal Standing Legs (Planted on ground line y=186 with wide muscular stance)
  const legsLayer = `
    <g id="lobster-legs-layer" class="lobster-idle-layer lobster-idle-legs">
      <!-- Legs Drop Shadow -->
      <g opacity="0.24" transform="translate(1.5, 2)">
        <!-- Left Standing Leg -->
        <path d="M 32 136 C 26 146 18 152 16 158 L 23 161 C 27 152 34 146 39 136 Z" fill="#020810" />
        <path d="M 16 158 L 13 178 L 20 178 L 23 161 Z" fill="#020810" />
        <path d="M 6 186 C 6 180 13 177 19 177 C 25 177 30 180 32 186 Z" fill="#020810" />
        <!-- Right Standing Leg -->
        <path d="M 68 136 C 74 146 82 152 84 158 L 77 161 C 73 152 66 146 61 136 Z" fill="#020810" />
        <path d="M 84 158 L 87 178 L 80 178 L 77 161 Z" fill="#020810" />
        <path d="M 68 186 C 70 180 75 177 81 177 C 87 177 94 180 94 186 Z" fill="#020810" />
      </g>

      <!-- Left Standing Leg Base Chitin -->
      <!-- Thigh -->
      <path d="M 32 136 C 26 146 18 152 16 158 L 23 161 C 27 152 34 146 39 136 Z" fill="${chitinColor}" />
      <path d="M 30 138 C 25 146 20 151 18 157" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.32" fill="none" />
      <!-- Armored Knee Plate -->
      <ellipse cx="20" cy="159" rx="5" ry="3.8" fill="${chitinColor}" />
      <ellipse cx="20" cy="159" rx="2.8" ry="2" fill="#ffffff" opacity="0.25" />
      <!-- Shin / Crus -->
      <path d="M 16 158 L 13 178 L 20 178 L 23 161 Z" fill="${chitinColor}" />
      <path d="M 18 162 L 16 176" stroke="#ffffff" stroke-width="1.4" opacity="0.25" stroke-linecap="round" />
      <!-- Ankle Joint -->
      <ellipse cx="17" cy="178" rx="4.5" ry="2.2" fill="${chitinColor}" />
      <!-- Clawed Standing Boot Foot -->
      <path d="M 6 186 C 6 179 13 177 19 177 C 25 177 30 179 32 186 Z" fill="${chitinColor}" />
      <path d="M 6 186 L 32 186" stroke="#020810" stroke-width="1.5" opacity="0.4" />
      <!-- Toe Claws -->
      <path d="M 6 186 C 3 186 1 183 4 181 C 7 181 9 183 10 186 Z" fill="#ffffff" opacity="0.85" />
      <path d="M 28 186 C 30 183 33 181 35 183 C 34 186 32 186 28 186 Z" fill="#ffffff" opacity="0.85" />

      <!-- Right Standing Leg Base Chitin -->
      <!-- Thigh -->
      <path d="M 68 136 C 74 146 82 152 84 158 L 77 161 C 73 152 66 146 61 136 Z" fill="${chitinColor}" />
      <path d="M 70 138 C 75 146 80 151 82 157" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.32" fill="none" />
      <!-- Armored Knee Plate -->
      <ellipse cx="80" cy="159" rx="5" ry="3.8" fill="${chitinColor}" />
      <ellipse cx="80" cy="159" rx="2.8" ry="2" fill="#ffffff" opacity="0.25" />
      <!-- Shin / Crus -->
      <path d="M 84 158 L 87 178 L 80 178 L 77 161 Z" fill="${chitinColor}" />
      <path d="M 82 162 L 84 176" stroke="#ffffff" stroke-width="1.4" opacity="0.25" stroke-linecap="round" />
      <!-- Ankle Joint -->
      <ellipse cx="83" cy="178" rx="4.5" ry="2.2" fill="${chitinColor}" />
      <!-- Clawed Standing Boot Foot -->
      <path d="M 68 186 C 70 179 75 177 81 177 C 87 177 94 179 94 186 Z" fill="${chitinColor}" />
      <path d="M 68 186 L 94 186" stroke="#020810" stroke-width="1.5" opacity="0.4" />
      <!-- Toe Claws -->
      <path d="M 65 183 C 67 181 70 183 72 186 C 68 186 66 186 65 183 Z" fill="#ffffff" opacity="0.85" />
      <path d="M 90 186 C 91 183 93 181 96 181 C 99 183 97 186 94 186 Z" fill="#ffffff" opacity="0.85" />
    </g>`

  // Parametric Abdomen: Somite 1 top width exactly matches the bottom width of the chest (cw * 2)
  const w1_top = cw
  const w1_bot = Math.round(cw * 0.94)
  const w2_top = w1_bot
  const w2_bot = Math.round(cw * 0.88)
  const w3_top = w2_bot
  const w3_bot = Math.round(cw * 0.82)
  const w4_top = w3_bot
  const w4_bot = Math.round(cw * 0.76)
  const w5_top = w4_bot
  const w5_bot = Math.round(cw * 0.7)

  const s1_l_top = 50 - w1_top
  const s1_r_top = 50 + w1_top
  const s1_l_bot = 50 - w1_bot
  const s1_r_bot = 50 + w1_bot

  const s2_l_top = 50 - w2_top
  const s2_r_top = 50 + w2_top
  const s2_l_bot = 50 - w2_bot
  const s2_r_bot = 50 + w2_bot

  const s3_l_top = 50 - w3_top
  const s3_r_top = 50 + w3_top
  const s3_l_bot = 50 - w3_bot
  const s3_r_bot = 50 + w3_bot

  const s4_l_top = 50 - w4_top
  const s4_r_top = 50 + w4_top
  const s4_l_bot = 50 - w4_bot
  const s4_r_bot = 50 + w4_bot

  const s5_l_top = 50 - w5_top
  const s5_r_top = 50 + w5_top
  const s5_l_bot = 50 - w5_bot
  const s5_r_bot = 50 + w5_bot

  // Massive, Robust Anthropomorphic Abdominal Pleon Somites (Full-width torso matching carapace width)
  const abdomenLayer = `
    <g id="lobster-abdomen-layer" class="lobster-idle-layer lobster-idle-abdomen">
      <!-- Somite 5 / Pelvis Girdle (Y=138..151) -->
      <path d="M ${s5_l_top} 138 C ${s5_l_top - 2} 146 ${s5_l_bot - 4} 151 ${s5_l_bot} 151 L ${s5_r_bot} 151 C ${s5_r_bot + 4} 151 ${s5_r_top + 2} 146 ${s5_r_top} 138 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M ${s5_l_top} 138 C ${s5_l_top - 2} 146 ${s5_l_bot - 4} 151 ${s5_l_bot} 151 L ${s5_r_bot} 151 C ${s5_r_bot + 4} 151 ${s5_r_top + 2} 146 ${s5_r_top} 138 Z" fill="${chitinColor}" />
      <path d="M ${s5_l_top + 4} 142 C 36 148 64 148 ${s5_r_top - 4} 142" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.32" />
      <ellipse cx="50" cy="145" rx="9" ry="3.5" fill="#ffffff" opacity="0.2" />

      <!-- Somite 4 (Y=129..142) -->
      <path d="M ${s4_l_top} 129 C ${s4_l_top - 2} 137 ${s4_l_bot - 3} 142 ${s4_l_bot} 142 L ${s4_r_bot} 142 C ${s4_r_bot + 3} 142 ${s4_r_top + 2} 137 ${s4_r_top} 129 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M ${s4_l_top} 129 C ${s4_l_top - 2} 137 ${s4_l_bot - 3} 142 ${s4_l_bot} 142 L ${s4_r_bot} 142 C ${s4_r_bot + 3} 142 ${s4_r_top + 2} 137 ${s4_r_top} 129 Z" fill="${chitinColor}" />
      <path d="M ${s4_l_top + 4} 133 C 34 139 66 139 ${s4_r_top - 4} 133" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.32" />

      <!-- Somite 3 (Y=120..133) -->
      <path d="M ${s3_l_top} 120 C ${s3_l_top - 2} 128 ${s3_l_bot - 3} 133 ${s3_l_bot} 133 L ${s3_r_bot} 133 C ${s3_r_bot + 3} 133 ${s3_r_top + 2} 128 ${s3_r_top} 120 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M ${s3_l_top} 120 C ${s3_l_top - 2} 128 ${s3_l_bot - 3} 133 ${s3_l_bot} 133 L ${s3_r_bot} 133 C ${s3_r_bot + 3} 133 ${s3_r_top + 2} 128 ${s3_r_top} 120 Z" fill="${chitinColor}" />
      <path d="M ${s3_l_top + 4} 124 C 34 130 66 130 ${s3_r_top - 4} 124" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />

      <!-- Somite 2 (Y=111..124) -->
      <path d="M ${s2_l_top} 111 C ${s2_l_top - 2} 119 ${s2_l_bot - 3} 124 ${s2_l_bot} 124 L ${s2_r_bot} 124 C ${s2_r_bot + 3} 124 ${s2_r_top + 2} 119 ${s2_r_top} 111 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M ${s2_l_top} 111 C ${s2_l_top - 2} 119 ${s2_l_bot - 3} 124 ${s2_l_bot} 124 L ${s2_r_bot} 124 C ${s2_r_bot + 3} 124 ${s2_r_top + 2} 119 ${s2_r_top} 111 Z" fill="${chitinColor}" />
      <path d="M ${s2_l_top + 4} 115 C 34 121 66 121 ${s2_r_top - 4} 115" stroke="#ffffff" stroke-width="2.8" fill="none" opacity="0.32" />

      <!-- Somite 1 (Upper thorax transition - starts at y=102, matching chest width at y=106) -->
      <path d="M ${s1_l_top} 102 C ${s1_l_top - 2} 110 ${s1_l_bot - 3} 115 ${s1_l_bot} 115 L ${s1_r_bot} 115 C ${s1_r_bot + 3} 115 ${s1_r_top + 2} 110 ${s1_r_top} 102 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M ${s1_l_top} 102 C ${s1_l_top - 2} 110 ${s1_l_bot - 3} 115 ${s1_l_bot} 115 L ${s1_r_bot} 115 C ${s1_r_bot + 3} 115 ${s1_r_top + 2} 110 ${s1_r_top} 102 Z" fill="${chitinColor}" />
      <path d="M ${s1_l_top + 4} 106 C 34 112 66 112 ${s1_r_top - 4} 106" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />

      <!-- Central Dorsal Keel Highlight -->
      <path d="M 50 104 L 50 148" stroke="#ffffff" stroke-width="2.4" opacity="0.28" stroke-linecap="round" />
    </g>`

  const armsLayer = `
    <g id="lobster-arms-layer" data-pose="${pose.name}">
      <!-- Arm Shadows behind body -->
      <g opacity="0.22" transform="translate(1.5, 2)">
        <path d="${pose.leftArm}" fill="#020810" />
        <path d="${pose.rightArm}" fill="#020810" />
      </g>
      <!-- Base Arm Tubes -->
      <g id="lobster-arm-left" class="lobster-idle-layer lobster-idle-arm-left">
        <path d="${pose.leftArm}" fill="${chitinColor}" />
      </g>
      <g id="lobster-arm-right" class="lobster-idle-layer lobster-idle-arm-right">
        <path d="${pose.rightArm}" fill="${chitinColor}" />
      </g>
    </g>`

  const clawsLayer = `
    <g id="lobster-claws-layer">
      <g id="lobster-claw-left" class="lobster-idle-layer lobster-idle-claw-left">
        ${renderClawElement(pose.leftClaw, chitinColor)}
      </g>
      <g id="lobster-claw-right" class="lobster-idle-layer lobster-idle-claw-right">
        ${renderClawElement(pose.rightClaw, chitinColor)}
      </g>
    </g>`

  const browLayer = `
    <g id="lobster-brow-layer" class="lobster-idle-layer lobster-idle-brow">
      <!-- Left Eyebrow -->
      <g id="lobster-brow-left" class="lobster-idle-layer lobster-idle-brow-left">
        <path d="${leftEyebrow}" stroke="#020810" stroke-width="2.5" stroke-linecap="round" opacity="0.22" />
        <path d="${leftEyebrow}" stroke="${chitinColor}" stroke-width="1.8" stroke-linecap="round" />
      </g>
      <!-- Right Eyebrow -->
      <g id="lobster-brow-right" class="lobster-idle-layer lobster-idle-brow-right">
        <path d="${rightEyebrow}" stroke="#020810" stroke-width="2.5" stroke-linecap="round" opacity="0.22" />
        <path d="${rightEyebrow}" stroke="${chitinColor}" stroke-width="1.8" stroke-linecap="round" />
      </g>
    </g>`

  let outputSvg = rawSvg

  // 1. Expand ViewBox from 0 0 100 100 to tightly framed square character frame (housing side tails, claws, and antennas with balanced margins)
  outputSvg = outputSvg.replace('viewBox="0 0 100 100"', 'viewBox="-65 -35 230 230"')
  if (!outputSvg.includes('xmlns:xlink=')) {
    outputSvg = outputSvg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
  }

  // 2. Strip any opaque background rect and outer root 100x100 viewport clipPath for clean alpha transparency
  outputSvg = outputSvg.replace(/<rect width="100" height="100"[^>]*\/>/g, '')
  outputSvg = outputSvg.replace(/<clipPath id="clip-[^"]+"><rect width="100" height="100"[^>]*\/><\/clipPath>/g, '')
  outputSvg = outputSvg.replace(/clip-path="url\(#clip-[^)]+\)"/g, '')

  // 3. Ensure all <use> tags support SVG 1.1 / xlink:href for wide rasterizer and canvas compatibility
  outputSvg = outputSvg.replace(/<use([^>]+)href="/g, '<use$1xlink:href="')

  // 4. Suppress stubby default critters antennae (so our long sweeping feelers take precedence)
  outputSvg = outputSvg.replace('<g class="dbcr-t">', '<g class="dbcr-t" opacity="0">')

  // 5. Inject SVG <defs> containing background gradients
  if (!isTransparent) {
    const svgTagIndex = outputSvg.indexOf('>')
    if (svgTagIndex !== -1) {
      outputSvg = outputSvg.slice(0, svgTagIndex + 1) + defsLayer + outputSvg.slice(svgTagIndex + 1)
    }
  }

  // 6. Inject sub-carapace elements (on-brand background + pattern, ground shadow, tail fan on floor, flank limbs, standing legs, abdomen, arms) behind the main carapace
  const backgroundLayers =
    (isTransparent ? '' : backgroundLayer) +
    groundShadowLayer +
    tailFanLayer +
    flankLimbsLayer +
    legsLayer +
    abdomenLayer +
    armsLayer

  const bodyUseIndex = outputSvg.indexOf('<use')
  const bodyPeakIndex = outputSvg.search(/<use[^>]+#body-/)
  const insertTarget = bodyPeakIndex !== -1 ? bodyPeakIndex : bodyUseIndex

  if (insertTarget !== -1) {
    outputSvg = outputSvg.slice(0, insertTarget) + backgroundLayers + outputSvg.slice(insertTarget)
  } else {
    const insertIndex = outputSvg.lastIndexOf('</g></svg>')
    outputSvg = outputSvg.slice(0, insertIndex) + backgroundLayers + outputSvg.slice(insertIndex)
  }

  outputSvg = wrapDiceBearUsesInCarapaceLayer(outputSvg)
  outputSvg = splitEyesForPupilTracking(outputSvg, chitinColor, eyelidStyle)

  // 7. Layer claws, brow ridge, and modular antennae on TOP of the carapace and facial plane
  const endGIndex = outputSvg.lastIndexOf('</g></svg>')
  if (endGIndex !== -1) {
    outputSvg = outputSvg.slice(0, endGIndex) + clawsLayer + browLayer + antennaeLayer + outputSvg.slice(endGIndex)
  }

  return outputSvg
}

function getAvatarCacheKey(config: LobsterAvatarConfig, size: number): string {
  return `${config.seed}|${size}|${config.backgroundTheme ?? ''}|${config.backgroundPattern ?? ''}|${config.backgroundTexture ?? ''}|${config.patternDensity ?? ''}|${config.patternGlow ?? ''}|${config.patternPulse ?? ''}|${config.patternSparkles ?? ''}|${config.eyelidStyle ?? ''}|${config.backgroundMotion ?? ''}|${config.transparentBackground ? '1' : '0'}`
}

const MAX_GENERATED_AVATAR_CACHE = 128
const generatedSvgCache = new Map<string, string>()
const generatedDataUriCache = new Map<string, string>()

export function clearGeneratedAvatarCache(): void {
  generatedSvgCache.clear()
  generatedDataUriCache.clear()
}

export function generateLobsterAvatarSvg(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const key = getAvatarCacheKey(config, size)
  const cached = generatedSvgCache.get(key)
  if (cached !== undefined) {
    generatedSvgCache.delete(key)
    generatedSvgCache.set(key, cached)
    return cached
  }

  const avatar = new Avatar(crittersStyle, {
    seed: config.seed,
    size,
    ...LOBSTER_CRUSTACEAN_OPTIONS,
  })
  const rawSvg = avatar.toString()
  const svg = injectLobsterChitinLayers(rawSvg, config)

  if (svg) {
    if (generatedSvgCache.size >= MAX_GENERATED_AVATAR_CACHE) {
      const oldest = generatedSvgCache.keys().next().value
      if (oldest !== undefined) generatedSvgCache.delete(oldest)
    }
    generatedSvgCache.set(key, svg)
  }

  return svg
}

export function generateLobsterAvatarDataUri(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const key = getAvatarCacheKey(config, size)
  const cached = generatedDataUriCache.get(key)
  if (cached !== undefined) {
    generatedDataUriCache.delete(key)
    generatedDataUriCache.set(key, cached)
    return cached
  }

  const svg = generateLobsterAvatarSvg(config, size)
  if (!svg) return null
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  if (generatedDataUriCache.size >= MAX_GENERATED_AVATAR_CACHE) {
    const oldest = generatedDataUriCache.keys().next().value
    if (oldest !== undefined) generatedDataUriCache.delete(oldest)
  }
  generatedDataUriCache.set(key, dataUri)

  return dataUri
}

const profileAvatarCache = new Map<string, string | null>()

export function getCachedProfileAvatarUrl(userId: string): string | null | undefined {
  return profileAvatarCache.get(userId)
}

export function setCachedProfileAvatarUrl(userId: string, url: string | null): void {
  profileAvatarCache.set(userId, url)
}

export function clearCachedProfileAvatarUrl(userId: string): void {
  profileAvatarCache.delete(userId)
}
