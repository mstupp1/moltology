/**
 * Avatar backdrops: two-colour benthic themes, animated vector patterns,
 * PBR texture underlays, and face sparkles. Shared by every race.
 */
import { S3_BASE_URL } from '../assets'

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

export const LOBSTER_BACKGROUND_MOTION_MODES: readonly BackgroundMotionMode[] = [
  'drift_diagonal',
  'drift_horizontal',
  'radar_sweep',
  'wave_undulate',
  'pulse_breathe',
  'static',
] as const

export function escapeSvgAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export type PatternDensity = 'compact' | 'standard' | 'spacious'
export type PatternGlow = 'subtle' | 'chromatic' | 'none'
export type PatternPulse = 'pulse' | 'steady'
export type PatternSparkles = 'subtle' | 'radiant' | 'none'

export const LOBSTER_PATTERN_DENSITIES: readonly PatternDensity[] = ['compact', 'standard', 'spacious'] as const
export const LOBSTER_PATTERN_GLOWS: readonly PatternGlow[] = ['subtle', 'chromatic', 'none'] as const
export const LOBSTER_PATTERN_PULSES: readonly PatternPulse[] = ['pulse', 'steady'] as const
export const LOBSTER_PATTERN_SPARKLES: readonly PatternSparkles[] = ['subtle', 'radiant', 'none'] as const

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

      return `<g id="pattern-isometric-cubes"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-bubbles"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-circuit"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-hex-mesh"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-overlapping-circles"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-triangle-constellations"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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

      return `<g id="pattern-dense-lattice"${isMoving ? ` data-motion="${escapeSvgAttr(motion.mode)}"` : ''}>
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
