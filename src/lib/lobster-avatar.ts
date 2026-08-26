import { Style, Avatar } from '@dicebear/core'
import type { StyleDefinition } from '@dicebear/core'
import critters from '@dicebear/styles/critters.json' with { type: 'json' }

export const LOBSTER_AVATAR_STYLE = 'critters' as const

export interface BackgroundTheme {
  id: string
  name: string
  label: string
  topColor: string
  bottomColor: string
  accentColor: string
  gridColor: string
  glowColor: string
}

export interface BackgroundPattern {
  id: string
  name: string
  label: string
  render: (theme: BackgroundTheme, patternId: string) => string
}

export interface LobsterAvatarConfig {
  style: typeof LOBSTER_AVATAR_STYLE
  seed: string
  backgroundTheme?: string
  backgroundPattern?: string
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
 * 8 Canonical On-Brand Benthic & Cyber Background Color Themes
 * High-contrast dark oceanic and HUD environments that make red/coral chitin pop vibrantly.
 */
export const LOBSTER_BACKGROUND_THEMES: readonly BackgroundTheme[] = [
  // 0: Deep Benthic Void Matrix (Classic Moltology deep abyss)
  {
    id: 'deep_abyss',
    name: 'Benthic Void',
    label: 'Deep Void',
    topColor: '#071624',
    bottomColor: '#01050a',
    accentColor: '#00c3ff',
    gridColor: 'rgba(0, 195, 255, 0.16)',
    glowColor: 'rgba(0, 195, 255, 0.28)',
  },
  // 1: Sub-Benthic Hydro Trench (Bioluminescent cyan deep ocean)
  {
    id: 'bio_cyan',
    name: 'Hydro Trench',
    label: 'Hydro Cyan',
    topColor: '#032433',
    bottomColor: '#010d14',
    accentColor: '#38bdf8',
    gridColor: 'rgba(56, 189, 248, 0.18)',
    glowColor: 'rgba(0, 255, 255, 0.32)',
  },
  // 2: Algal Mariana Depths (Sub-benthic emerald algae flora)
  {
    id: 'hydro_emerald',
    name: 'Algal Depths',
    label: 'Emerald Algae',
    topColor: '#052922',
    bottomColor: '#010f0b',
    accentColor: '#34d399',
    gridColor: 'rgba(52, 211, 153, 0.16)',
    glowColor: 'rgba(52, 211, 153, 0.28)',
  },
  // 3: Synaptic Void Rift (Deep purple-indigo neural trench)
  {
    id: 'abyssal_indigo',
    name: 'Synaptic Void',
    label: 'Void Indigo',
    topColor: '#180e2e',
    bottomColor: '#070212',
    accentColor: '#a78bfa',
    gridColor: 'rgba(167, 139, 250, 0.16)',
    glowColor: 'rgba(167, 139, 250, 0.26)',
  },
  // 4: Hydrothermal Magma Vent (Volcanic crustacean vent basalt)
  {
    id: 'thermal_vent',
    name: 'Thermal Vent',
    label: 'Magma Vent',
    topColor: '#2a0c0a',
    bottomColor: '#0d0202',
    accentColor: '#ff5540',
    gridColor: 'rgba(255, 85, 64, 0.16)',
    glowColor: 'rgba(255, 85, 64, 0.28)',
  },
  // 5: Titanium Chitin Alloy (Sub-dermal metallic armor plate)
  {
    id: 'titanium_slate',
    name: 'Titanium Alloy',
    label: 'Slate Alloy',
    topColor: '#15222e',
    bottomColor: '#060b10',
    accentColor: '#7dd3fc',
    gridColor: 'rgba(125, 211, 252, 0.15)',
    glowColor: 'rgba(125, 211, 252, 0.24)',
  },
  // 6: Sacred Mariana Relic (Ancient amber sediment glow)
  {
    id: 'sacred_amber',
    name: 'Sacred Relic',
    label: 'Amber Relic',
    topColor: '#261805',
    bottomColor: '#0c0701',
    accentColor: '#fbbf24',
    gridColor: 'rgba(251, 191, 36, 0.16)',
    glowColor: 'rgba(251, 191, 36, 0.26)',
  },
  // 7: Cobalt Superconductor (High-frequency electric core)
  {
    id: 'cobalt_pulse',
    name: 'Superconductor',
    label: 'Cobalt Pulse',
    topColor: '#0a1a3a',
    bottomColor: '#020612',
    accentColor: '#60a5fa',
    gridColor: 'rgba(96, 165, 250, 0.18)',
    glowColor: 'rgba(96, 165, 250, 0.32)',
  },
]

export const LOBSTER_BACKGROUND_THEME_MAP: Record<string, BackgroundTheme> = Object.fromEntries(
  LOBSTER_BACKGROUND_THEMES.map((theme) => [theme.id, theme])
)

/**
 * 8 Canonical Simple Pixel-Art Background Patterns
 * Vector geometries calibrated to downscale into authentic 16-bit arcade pixel art.
 */
export const LOBSTER_BACKGROUND_PATTERNS: readonly BackgroundPattern[] = [
  // 0: Coordinate Matrix Grid (Sub-benthic HUD grid with crosshair intersections)
  {
    id: 'matrix_grid',
    name: 'Coordinate Matrix Grid',
    label: 'Matrix Grid',
    render: (theme) => {
      const vLines = [-60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160]
        .map((x) => `<line x1="${x}" y1="-50" x2="${x}" y2="205" stroke="${theme.accentColor}" stroke-width="1.2" opacity="0.16" />`)
        .join('')
      const hLines = [-30, -10, 10, 30, 50, 70, 90, 110, 130, 150, 170, 190]
        .map((y) => `<line x1="-80" y1="${y}" x2="180" y2="${y}" stroke="${theme.accentColor}" stroke-width="1.2" opacity="0.16" />`)
        .join('')
      const nodes = [
        { x: -20, y: 30 },
        { x: 120, y: 30 },
        { x: -20, y: 130 },
        { x: 120, y: 130 },
        { x: 50, y: 70 },
      ]
        .map(
          (pt) => `
            <path d="M ${pt.x - 3} ${pt.y} L ${pt.x + 3} ${pt.y} M ${pt.x} ${pt.y - 3} L ${pt.x} ${pt.y + 3}" stroke="${theme.accentColor}" stroke-width="1.6" opacity="0.4" />
            <circle cx="${pt.x}" cy="${pt.y}" r="1.5" fill="${theme.accentColor}" opacity="0.6" />
          `
        )
        .join('')
      return `<g id="pattern-matrix-grid">${vLines}${hLines}${nodes}</g>`
    },
  },
  // 1: Telemetry Sonar Dots (Retro dot-matrix radar grid)
  {
    id: 'sonar_dots',
    name: 'Telemetry Sonar Dots',
    label: 'Sonar Dots',
    render: (theme) => {
      const dots: string[] = []
      for (let x = -60; x <= 160; x += 22) {
        for (let y = -35; y <= 195; y += 22) {
          dots.push(`<circle cx="${x}" cy="${y}" r="1.8" fill="${theme.accentColor}" opacity="0.22" />`)
        }
      }
      return `<g id="pattern-sonar-dots">${dots.join('')}</g>`
    },
  },
  // 2: Terminal Scanlines (Horizontal telemetry raster bars)
  {
    id: 'terminal_scanlines',
    name: 'Terminal Scanlines',
    label: 'Scanlines',
    render: (theme) => {
      const lines: string[] = []
      for (let y = -36; y <= 196; y += 10) {
        lines.push(
          `<line x1="-80" y1="${y}" x2="180" y2="${y}" stroke="${theme.accentColor}" stroke-width="2.2" opacity="0.15" />`
        )
      }
      return `<g id="pattern-terminal-scanlines">${lines.join('')}</g>`
    },
  },
  // 3: Carbon Chitin Weave (45-degree diagonal armor hatching)
  {
    id: 'carbon_weave',
    name: 'Carbon Armor Weave',
    label: 'Armor Weave',
    render: (theme) => {
      const lines: string[] = []
      for (let offset = -280; offset <= 280; offset += 20) {
        lines.push(
          `<line x1="${-80 + offset}" y1="-50" x2="${-80 + offset + 260}" y2="210" stroke="${theme.accentColor}" stroke-width="1.8" opacity="0.14" />`
        )
      }
      return `<g id="pattern-carbon-weave">${lines.join('')}</g>`
    },
  },
  // 4: Diamond Sonar Rings (Concentric diamond telemetry rings behind torso)
  {
    id: 'diamond_sonar',
    name: 'Diamond Sonar Rings',
    label: 'Diamond Sonar',
    render: (theme) => {
      const cx = 50
      const cy = 77
      const radii = [30, 60, 90, 120, 150, 180]
      const rings = radii
        .map(
          (r, idx) =>
            `<path d="M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z" stroke="${theme.accentColor}" stroke-width="${idx % 2 === 0 ? 2 : 1.2}" fill="none" opacity="${0.24 - idx * 0.03}" />`
        )
        .join('')
      const cross = `
        <line x1="-80" y1="${cy}" x2="180" y2="${cy}" stroke="${theme.accentColor}" stroke-width="1.2" opacity="0.15" stroke-dasharray="4 4" />
        <line x1="${cx}" y1="-50" x2="${cx}" y2="205" stroke="${theme.accentColor}" stroke-width="1.2" opacity="0.15" stroke-dasharray="4 4" />
      `
      return `<g id="pattern-diamond-sonar">${cross}${rings}</g>`
    },
  },
  // 5: Hexagonal Chitin Lattice (Exoskeleton honeycomb cells)
  {
    id: 'chitin_hex',
    name: 'Hexagonal Chitin Lattice',
    label: 'Hex Lattice',
    render: (theme) => {
      const hexes: string[] = []
      const r = 18
      const dx = r * 1.732
      const dy = r * 1.5
      for (let row = -2; row <= 10; row++) {
        const y = -40 + row * dy
        const xOffset = (row % 2 === 0) ? 0 : dx / 2
        for (let col = -3; col <= 8; col++) {
          const x = -50 + col * dx + xOffset
          hexes.push(
            `<polygon points="${x},${y - r} ${x + dx / 2},${y - r / 2} ${x + dx / 2},${y + r / 2} ${x},${y + r} ${x - dx / 2},${y + r / 2} ${x - dx / 2},${y - r / 2}" fill="none" stroke="${theme.accentColor}" stroke-width="1.2" opacity="0.13" />`
          )
        }
      }
      return `<g id="pattern-chitin-hex">${hexes.join('')}</g>`
    },
  },
  // 6: Sub-Benthic Halo Core (Stepped concentric glow disc halo behind carapace)
  {
    id: 'radial_halo',
    name: 'Sub-Benthic Halo Core',
    label: 'Halo Core',
    render: (theme) => {
      const cx = 50
      const cy = 72
      const radii = [26, 52, 78, 106, 136, 168]
      const rings = radii
        .map(
          (r, idx) =>
            `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.accentColor}" stroke-width="${idx === 0 ? 2.5 : 1.4}" opacity="${0.28 - idx * 0.035}" ${idx % 2 === 1 ? 'stroke-dasharray="6 4"' : ''} />`
        )
        .join('')
      const core = `<circle cx="${cx}" cy="${cy}" r="38" fill="${theme.accentColor}" opacity="0.08" />`
      return `<g id="pattern-radial-halo">${core}${rings}</g>`
    },
  },
  // 7: 16-Bit Arcade Dither (Classic arcade checkerboard dither bands)
  {
    id: 'arcade_dither',
    name: '16-Bit Arcade Dither',
    label: 'Arcade Dither',
    render: (theme) => {
      const blocks: string[] = []
      for (let x = -70; x <= 170; x += 12) {
        for (let y = -40; y <= 30; y += 12) {
          if (((x + y) / 12) % 2 === 0) {
            blocks.push(`<rect x="${x}" y="${y}" width="5" height="5" fill="${theme.accentColor}" opacity="0.18" />`)
          }
        }
      }
      for (let x = -70; x <= 170; x += 12) {
        for (let y = 130; y <= 200; y += 12) {
          if (((x + y) / 12) % 2 === 0) {
            blocks.push(`<rect x="${x}" y="${y}" width="6" height="6" fill="#000000" opacity="0.45" />`)
          }
        }
      }
      return `<g id="pattern-arcade-dither">${blocks.join('')}</g>`
    },
  },
]

export const LOBSTER_BACKGROUND_PATTERN_MAP: Record<string, BackgroundPattern> = Object.fromEntries(
  LOBSTER_BACKGROUND_PATTERNS.map((pat) => [pat.id, pat])
)

/**
 * Returns the deterministic chassis & telemetry attributes computed from an avatar seed.
 */
export function getLobsterAvatarSeededOptions(seed: string): {
  theme: BackgroundTheme
  pattern: BackgroundPattern
  clawPose: ClawPose
  antennaStyle: AntennaStyle
  tailPose: 'right' | 'left' | 'center'
} {
  let hash1 = 0
  let hash2 = 0
  let hash3 = 0
  let hash4 = 0
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i)
    hash1 = (((hash1 << 5) - hash1) + ch) | 0
    hash2 = ((hash2 * 37) + ch + 11) | 0
    hash3 = (((hash3 << 7) - hash3) + ch * 17 + 19) | 0
    hash4 = (((hash4 << 9) + hash4) + ch * 31 + 23) | 0
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

  return { theme, pattern, clawPose, antennaStyle, tailPose }
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
  eyesVariant: ['round', 'bigPupils', 'happy', 'dots', 'wink', 'wide'] as const,

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
      <g id="lobster-antennae-layer" data-antenna="sweeping_whips">
        <!-- Shadow -->
        <g opacity="0.25" transform="translate(1.5, 2)">
          <path d="M 43 32 C 40 10 30 -10 14 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <circle cx="14" cy="-24" r="4.5" fill="#020810" />
          <path d="M 57 32 C 60 10 70 -10 86 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <circle cx="86" cy="-24" r="4.5" fill="#020810" />
          <path d="M 46 28 C 45 15 42 4 38 -5" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <circle cx="38" cy="-5" r="3" fill="#020810" />
          <path d="M 54 28 C 55 15 58 4 62 -5" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <circle cx="62" cy="-5" r="3" fill="#020810" />
        </g>
        <!-- Primary Left Long Antenna -->
        <path d="M 43 32 C 40 10 30 -10 14 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 42 28 C 39 10 30 -8 15 -21" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.35" fill="none" />
        <circle cx="14" cy="-24" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <!-- Primary Right Long Antenna -->
        <path d="M 57 32 C 60 10 70 -10 86 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 58 28 C 61 10 70 -8 85 -21" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.35" fill="none" />
        <circle cx="86" cy="-24" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <!-- Secondary Inner Antennules -->
        <path d="M 46 28 C 45 15 42 4 38 -5" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="38" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />
        <path d="M 54 28 C 55 15 58 4 62 -5" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="62" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />
      </g>`,
  },
  // 1: Cyber Lightning / Angular Stepped Sensors (Techy zig-zag with diamond nodes)
  {
    name: 'cyber_lightning',
    render: (chitin) => `
      <g id="lobster-antennae-layer" data-antenna="cyber_lightning">
        <!-- Shadow -->
        <g opacity="0.25" transform="translate(1.5, 2)">
          <path d="M 43 30 L 36 12 L 42 2 L 26 -14 L 16 -26" stroke="#020810" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <rect x="13" y="-29" width="6" height="6" transform="rotate(45 16 -26)" fill="#020810" />
          <path d="M 57 30 L 64 12 L 58 2 L 74 -14 L 84 -26" stroke="#020810" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <rect x="81" y="-29" width="6" height="6" transform="rotate(45 84 -26)" fill="#020810" />
          <path d="M 46 28 L 44 14 L 40 4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M 54 28 L 56 14 L 60 4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>
        <!-- Primary Left Lightning Antenna -->
        <path d="M 43 30 L 36 12 L 42 2 L 26 -14 L 16 -26" stroke="${chitin}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <rect x="13" y="-29" width="6" height="6" transform="rotate(45 16 -26)" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <circle cx="42" cy="2" r="2" fill="#ffffff" opacity="0.75" />
        <!-- Primary Right Lightning Antenna -->
        <path d="M 57 30 L 64 12 L 58 2 L 74 -14 L 84 -26" stroke="${chitin}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <rect x="81" y="-29" width="6" height="6" transform="rotate(45 84 -26)" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <circle cx="58" cy="2" r="2" fill="#ffffff" opacity="0.75" />
        <!-- Inner Feeler Probes -->
        <path d="M 46 28 L 44 14 L 40 4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="40" cy="4" r="2" fill="#ffffff" opacity="0.85" />
        <path d="M 54 28 L 56 14 L 60 4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="60" cy="4" r="2" fill="#ffffff" opacity="0.85" />
      </g>`,
  },
  // 2: Spiral Horns / Ram Feeler Coils (Playful curly loops at tips)
  {
    name: 'spiral_horns',
    render: (chitin) => `
      <g id="lobster-antennae-layer" data-antenna="spiral_horns">
        <!-- Shadow -->
        <g opacity="0.25" transform="translate(1.5, 2)">
          <path d="M 43 30 C 40 8 20 0 14 -12 C 8 -22 18 -30 26 -22 C 30 -16 26 -10 18 -14" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 57 30 C 60 8 80 0 86 -12 C 92 -22 82 -30 74 -22 C 70 -16 74 -10 82 -14" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 46 28 C 45 16 40 8 36 2" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M 54 28 C 55 16 60 8 64 2" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
        </g>
        <!-- Left Spiral Horn -->
        <path d="M 43 30 C 40 8 20 0 14 -12 C 8 -22 18 -30 26 -22 C 30 -16 26 -10 18 -14" stroke="${chitin}" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <circle cx="26" cy="-22" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
        <!-- Right Spiral Horn -->
        <path d="M 57 30 C 60 8 80 0 86 -12 C 92 -22 82 -30 74 -22 C 70 -16 74 -10 82 -14" stroke="${chitin}" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <circle cx="74" cy="-22" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
        <!-- Inner Curly Feelers -->
        <path d="M 46 28 C 45 16 40 8 36 2" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="36" cy="2" r="2" fill="#ffffff" opacity="0.85" />
        <path d="M 54 28 C 55 16 60 8 64 2" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="64" cy="2" r="2" fill="#ffffff" opacity="0.85" />
      </g>`,
  },
  // 3: Twin Radar Beacons (Tall vertical masts with horizontal sensor fins & pulse rings)
  {
    name: 'twin_beacons',
    render: (chitin) => `
      <g id="lobster-antennae-layer" data-antenna="twin_beacons">
        <!-- Shadow -->
        <g opacity="0.25" transform="translate(1.5, 2)">
          <path d="M 44 30 C 43 10 40 -10 36 -28" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 30 -10 L 42 -10" stroke="#020810" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="36" cy="-28" r="5" fill="#020810" />
          <path d="M 56 30 C 57 10 60 -10 64 -28" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 58 -10 L 70 -10" stroke="#020810" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="64" cy="-28" r="5" fill="#020810" />
        </g>
        <!-- Left Beacon Mast -->
        <path d="M 44 30 C 43 10 40 -10 36 -28" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 30 -10 L 42 -10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.5" />
        <circle cx="36" cy="-28" r="5.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.35" />
        <circle cx="36" cy="-28" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <!-- Right Beacon Mast -->
        <path d="M 56 30 C 57 10 60 -10 64 -28" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 58 -10 L 70 -10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.5" />
        <circle cx="64" cy="-28" r="5.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.35" />
        <circle cx="64" cy="-28" r="3.8" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.4" />
        <!-- Center Transceiver array -->
        <ellipse cx="50" cy="26" rx="6" ry="2.5" fill="#ffffff" opacity="0.25" />
      </g>`,
  },
  // 4: Plumed Crest (3-Pronged majestic feather plumes / fan antennules)
  {
    name: 'plumed_crest',
    render: (chitin) => `
      <g id="lobster-antennae-layer" data-antenna="plumed_crest">
        <!-- Shadow -->
        <g opacity="0.25" transform="translate(1.5, 2)">
          <path d="M 43 30 C 40 8 28 -8 16 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 38 18 C 30 10 18 4 10 -4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M 34 2 C 30 -8 30 -16 28 -22" stroke="#020810" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <path d="M 57 30 C 60 8 72 -8 84 -24" stroke="#020810" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path d="M 62 18 C 70 10 82 4 90 -4" stroke="#020810" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M 66 2 C 70 -8 70 -16 72 -22" stroke="#020810" stroke-width="2.2" stroke-linecap="round" fill="none" />
        </g>
        <!-- Left 3-Prong Crest -->
        <path d="M 43 30 C 40 8 28 -8 16 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <circle cx="16" cy="-24" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
        <path d="M 38 18 C 30 10 18 4 10 -4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="10" cy="-4" r="2.2" fill="#ffffff" opacity="0.85" />
        <path d="M 34 2 C 30 -8 30 -16 28 -22" stroke="${chitin}" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="28" cy="-22" r="2" fill="#ffffff" opacity="0.85" />
        <!-- Right 3-Prong Crest -->
        <path d="M 57 30 C 60 8 72 -8 84 -24" stroke="${chitin}" stroke-width="3" stroke-linecap="round" fill="none" />
        <circle cx="84" cy="-24" r="3.2" fill="#ffffff" opacity="0.9" stroke="${chitin}" stroke-width="1.2" />
        <path d="M 62 18 C 70 10 82 4 90 -4" stroke="${chitin}" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <circle cx="90" cy="-4" r="2.2" fill="#ffffff" opacity="0.85" />
        <path d="M 66 2 C 70 -8 70 -16 72 -22" stroke="${chitin}" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="72" cy="-22" r="2" fill="#ffffff" opacity="0.85" />
      </g>`,
  },
]

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
  const seeded = getLobsterAvatarSeededOptions(seed)
  const pose = seeded.clawPose
  const antennaStyle = seeded.antennaStyle
  const tailPose = seeded.tailPose
  const theme = (config.backgroundTheme && LOBSTER_BACKGROUND_THEME_MAP[config.backgroundTheme]) || seeded.theme
  const pattern = (config.backgroundPattern && LOBSTER_BACKGROUND_PATTERN_MAP[config.backgroundPattern]) || seeded.pattern
  const isTransparent = Boolean(config.transparentBackground)

  // Subtle curved cartoon eyebrows positioned right above the orbital eye sockets
  const leftEyebrow = 'M 31 35 Q 37 31 43 35'
  const rightEyebrow = 'M 57 35 Q 63 31 69 35'

  // Render modular antenna variant
  const antennaeLayer = antennaStyle.render(chitinColor)

  const tailFlip = tailPose === 'left' ? 'transform="translate(100, 0) scale(-1, 1)"' : ''
  const tailShadowX = tailPose === 'right' ? 108 : tailPose === 'left' ? -8 : 50

  // 0. On-Brand Background Defs and Layer
  const bgGradId = `lobster-bg-grad-${theme.id}`
  const bgGlowId = `lobster-bg-glow-${theme.id}`
  const defsLayer = `
    <defs>
      <linearGradient id="${bgGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${theme.topColor}" />
        <stop offset="100%" stop-color="${theme.bottomColor}" />
      </linearGradient>
      <radialGradient id="${bgGlowId}" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${theme.glowColor}" />
        <stop offset="60%" stop-color="${theme.glowColor}" stop-opacity="0.2" />
        <stop offset="100%" stop-color="${theme.glowColor}" stop-opacity="0" />
      </radialGradient>
    </defs>`

  const backgroundLayer = `
    <g id="lobster-background-layer" data-theme="${theme.id}" data-pattern="${pattern.id}">
      <!-- Base Background Gradient -->
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGradId})" />
      <!-- Ambient Radial Glow Disc -->
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGlowId})" />
      <!-- Seeded Telemetry & Geometry Pattern -->
      ${pattern.render(theme, pattern.id)}
    </g>`

  // Ground Contact Shadow Layer (Distinct pools for feet and ground-resting tail)
  const groundShadowLayer = `
    <g id="lobster-ground-shadow">
      <!-- Center body ground shadow -->
      <ellipse cx="50" cy="173" rx="34" ry="4.5" fill="#020810" opacity="0.32" />
      <!-- Left & Right standing feet contact shadows -->
      <ellipse cx="19" cy="173" rx="15" ry="4.5" fill="#020810" opacity="0.52" />
      <ellipse cx="81" cy="173" rx="15" ry="4.5" fill="#020810" opacity="0.52" />
      <!-- Tail ground contact shadow -->
      <ellipse cx="${tailShadowX}" cy="${tailPose === 'center' ? 178 : 172}" rx="${tailPose === 'center' ? 36 : 22}" ry="${tailPose === 'center' ? 6 : 5.5}" fill="#020810" opacity="0.45" />
    </g>`

  // Massive, Articulated Conical Tail & 5-Blade Fan (Straight Down or Side-Sweeping)
  const tailFanLayer =
    tailPose === 'center'
      ? `
    <g id="lobster-tail-fan-layer" data-tail-pose="center">
      <!-- Floor Shadow Layer for Straight Down Tail -->
      <g opacity="0.28" transform="translate(0, 3)">
        <ellipse cx="50" cy="176" rx="38" ry="6" fill="#020810" />
      </g>

      <!-- 4 Conical Symmetrical Somites Descending Vertically Behind Legs -->
      <!-- Somite T4 (Distal segment of cone) -->
      <path d="M 39 152 C 39 162 43 168 50 168 C 57 168 61 162 61 152 Z" fill="${chitinColor}" />
      <path d="M 41 156 Q 50 162 59 156" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.32" />

      <!-- Somite T3 -->
      <path d="M 35 141 C 35 152 40 158 50 158 C 60 158 65 152 65 141 Z" fill="${chitinColor}" />
      <path d="M 38 145 Q 50 152 62 145" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />
      <!-- Lateral Spines -->
      <path d="M 35 148 L 27 145 L 34 154 Z" fill="${chitinColor}" />
      <path d="M 65 148 L 73 145 L 66 154 Z" fill="${chitinColor}" />

      <!-- Somite T2 -->
      <path d="M 31 130 C 31 142 36 148 50 148 C 64 148 69 142 69 130 Z" fill="${chitinColor}" />
      <path d="M 34 134 Q 50 142 66 134" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />
      <!-- Lateral Spines -->
      <path d="M 31 137 L 22 134 L 29 143 Z" fill="${chitinColor}" />
      <path d="M 69 137 L 78 134 L 71 143 Z" fill="${chitinColor}" />

      <!-- Somite T1 (Fattest Conical Base emerging from Pelvis) -->
      <path d="M 26 120 C 26 132 32 138 50 138 C 68 138 74 132 74 120 Z" fill="${chitinColor}" />
      <path d="M 30 124 Q 50 132 70 124" stroke="#ffffff" stroke-width="3.4" fill="none" opacity="0.32" />

      <!-- Joint Collar Node -->
      <ellipse cx="50" cy="166" rx="8.5" ry="5" fill="${chitinColor}" />
      <ellipse cx="50" cy="166" rx="5.5" ry="3" fill="#ffffff" opacity="0.3" />

      <!-- 5-Blade Symmetrical Fan (Spreading wide on ground behind legs) -->
      <!-- Central Telson -->
      <path d="M 43 165 C 44 176 46 186 50 188 C 54 186 56 176 57 165 Z" fill="${chitinColor}" />
      <ellipse cx="50" cy="176" rx="4.5" ry="7" fill="#ffffff" opacity="0.3" />
      <path d="M 50 166 L 50 186" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-linecap="round" />
      <circle cx="50" cy="186" r="2" fill="#ffffff" opacity="0.9" />

      <!-- Left Inner Uropod -->
      <path d="M 45 165 C 36 172 28 182 30 186 C 38 186 45 178 48 166 Z" fill="${chitinColor}" />
      <path d="M 43 169 C 37 174 32 181 33 184 C 38 184 43 178 46 170" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.35" />

      <!-- Right Inner Uropod -->
      <path d="M 55 165 C 64 172 72 182 70 186 C 62 186 55 178 52 166 Z" fill="${chitinColor}" />
      <path d="M 57 169 C 63 174 68 181 67 184 C 62 184 57 178 54 170" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.35" />

      <!-- Left Outer Uropod -->
      <path d="M 46 165 C 30 166 16 174 18 180 C 26 182 38 176 47 166 Z" fill="${chitinColor}" />
      <path d="M 44 167 C 32 168 21 174 22 178 C 28 179 38 175 45 168" stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.35" />

      <!-- Right Outer Uropod -->
      <path d="M 54 165 C 70 166 84 174 82 180 C 74 182 62 176 53 166 Z" fill="${chitinColor}" />
      <path d="M 56 167 C 68 168 79 174 78 178 C 72 179 62 175 55 168" stroke="#ffffff" stroke-width="1.3" fill="none" opacity="0.35" />
    </g>`
      : `
    <g id="lobster-tail-fan-layer" data-tail-pose="${tailPose}" ${tailFlip}>
      <!-- Shadow Layer on Floor -->
      <g opacity="0.28" transform="translate(2.5, 3)">
        <!-- Conical Trunk Shadow (Fattest at body, tapering to fan) -->
        <path d="M 34 104 C 64 108 96 124 116 144 C 122 152 126 160 126 168 L 102 178 C 84 170 60 154 40 140 C 26 130 18 122 16 120 Z" fill="#020810" />
        <!-- Massive Fan Blades Shadow -->
        <path d="M 116 162 C 128 144 144 138 152 144 C 156 152 144 166 126 172 Z" fill="#020810" />
        <path d="M 116 162 C 132 152 150 152 156 162 C 158 174 142 180 124 178 Z" fill="#020810" />
        <path d="M 114 162 C 126 162 144 168 142 178 C 138 188 122 188 112 180 Z" fill="#020810" />
        <path d="M 110 164 C 118 172 124 184 112 188 C 100 190 96 180 102 172 Z" fill="#020810" />
        <path d="M 106 166 C 108 176 98 186 86 187 C 76 186 78 176 88 170 Z" fill="#020810" />
      </g>

      <!-- 4 Conical Segmented Tail Somites (Fattest at body root, tapering to fan) -->
      <!-- Somite T4 (Distal segment of cone - width ~20) -->
      <path d="M 98 140 C 108 150 118 158 122 164 L 104 174 C 96 166 88 156 82 148 Z" fill="${chitinColor}" />
      <path d="M 100 144 Q 110 153 116 160" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.32" />

      <!-- Somite T3 (Mid-distal segment of cone - width ~26) -->
      <path d="M 80 126 C 94 136 108 148 114 156 L 94 166 C 86 158 72 146 62 134 Z" fill="${chitinColor}" />
      <path d="M 82 130 Q 96 142 106 152" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />
      <!-- Lateral Spine Spur on T3 -->
      <path d="M 104 142 L 115 138 L 110 150 Z" fill="${chitinColor}" />

      <!-- Somite T2 (Mid-proximal segment of cone - width ~33) -->
      <path d="M 58 112 C 78 122 96 136 104 144 L 82 156 C 72 146 54 134 38 122 Z" fill="${chitinColor}" />
      <path d="M 62 116 Q 82 128 96 138" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />
      <!-- Lateral Spine Spur on T2 -->
      <path d="M 90 126 L 102 122 L 96 134 Z" fill="${chitinColor}" />

      <!-- Somite T1 (Massive, Extra-Fat Conical Base emerging from Pelvis/Torso - width ~40) -->
      <path d="M 34 104 C 58 108 82 118 94 128 L 68 144 C 52 134 34 124 16 118 Z" fill="${chitinColor}" />
      <path d="M 38 108 Q 62 116 82 124" stroke="#ffffff" stroke-width="3.4" fill="none" opacity="0.32" />

      <!-- Heavy Tail Fan Joint Collar Node -->
      <ellipse cx="116" cy="166" rx="8.5" ry="6" fill="${chitinColor}" transform="rotate(25 116 166)" />
      <ellipse cx="116" cy="166" rx="5.5" ry="3.5" fill="#ffffff" opacity="0.3" transform="rotate(25 116 166)" />

      <!-- Massive 5-Blade Fan Tail (Flared out on the ground) -->
      <!-- 1. Upper Outer Uropod (Sweeping High Blade) -->
      <path d="M 114 162 C 126 144 144 138 152 144 C 156 152 144 166 126 172 Z" fill="${chitinColor}" />
      <path d="M 118 154 C 130 146 144 144 148 148 C 150 154 140 162 128 166" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" />
      <!-- Fluted Ribs -->
      <path d="M 122 158 L 140 150 M 124 162 L 144 158" stroke="#ffffff" stroke-width="1.3" opacity="0.25" />

      <!-- 2. Upper Inner Uropod (Secondary Upper Blade) -->
      <path d="M 114 162 C 130 152 150 152 156 162 C 158 174 142 180 124 178 Z" fill="${chitinColor}" />
      <path d="M 122 164 C 136 156 148 156 150 164 C 152 170 140 176 126 176" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.35" />
      <path d="M 124 167 L 146 167 M 124 172 L 144 173" stroke="#ffffff" stroke-width="1.3" opacity="0.25" />

      <!-- 3. Central Telson (Heroic Main Tail Blade with Dorsal Keel & Node) -->
      <path d="M 114 162 C 126 162 144 168 142 178 C 138 188 122 188 112 180 Z" fill="${chitinColor}" />
      <ellipse cx="128" cy="176" rx="7" ry="3.5" fill="#ffffff" opacity="0.3" transform="rotate(20 128 176)" />
      <path d="M 115 164 L 138 179" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-linecap="round" />
      <circle cx="137" cy="179" r="2" fill="#ffffff" opacity="0.9" />

      <!-- 4. Lower Inner Uropod (Secondary Lower Blade) -->
      <path d="M 110 164 C 118 172 124 184 112 188 C 100 190 96 180 102 172 Z" fill="${chitinColor}" />
      <path d="M 108 170 C 112 176 116 182 108 184 C 102 185 100 178 104 172" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.3" />

      <!-- 5. Lower Outer Uropod (Ground-Resting Trailing Blade) -->
      <path d="M 106 166 C 108 176 98 186 86 187 C 76 186 78 176 88 170 Z" fill="${chitinColor}" />
      <path d="M 100 171 C 102 177 94 182 88 182 C 82 181 84 176 90 172" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.3" />
    </g>`

  // Auxiliary Thoracic Flank Limbs (Folded side limbs behind thick waist)
  const flankLimbsLayer = `
    <g id="lobster-flank-limbs">
      <!-- Shadow -->
      <g opacity="0.2" transform="translate(1.5, 2)">
        <path d="M 24 88 Q 10 86 4 96 Q 2 104 2 110" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M 76 88 Q 90 86 96 96 Q 98 104 98 110" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M 26 102 Q 14 106 10 116 Q 8 124 8 132" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M 74 102 Q 86 106 90 116 Q 92 124 92 132" stroke="#020810" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </g>
      <!-- Base Chitin Flank Limbs -->
      <path d="M 24 88 Q 10 86 4 96 Q 2 104 2 110" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="4" cy="96" r="2.2" fill="${chitinColor}" />
      <path d="M 76 88 Q 90 86 96 96 Q 98 104 98 110" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="96" cy="96" r="2.2" fill="${chitinColor}" />
      
      <path d="M 26 102 Q 14 106 10 116 Q 8 124 8 132" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="10" cy="116" r="2.2" fill="${chitinColor}" />
      <path d="M 74 102 Q 86 106 90 116 Q 92 124 92 132" stroke="${chitinColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="90" cy="116" r="2.2" fill="${chitinColor}" />
    </g>`

  // Anthropomorphic Bipedal Standing Legs (Planted on ground line y=172 with wide muscular stance)
  const legsLayer = `
    <g id="lobster-legs-layer">
      <!-- Legs Drop Shadow -->
      <g opacity="0.24" transform="translate(1.5, 2)">
        <!-- Left Standing Leg -->
        <path d="M 32 122 C 26 132 18 138 16 144 L 23 147 C 27 138 34 132 39 122 Z" fill="#020810" />
        <path d="M 16 144 L 13 164 L 20 164 L 23 147 Z" fill="#020810" />
        <path d="M 6 172 C 6 166 13 163 19 163 C 25 163 30 166 32 172 Z" fill="#020810" />
        <!-- Right Standing Leg -->
        <path d="M 68 122 C 74 132 82 138 84 144 L 77 147 C 73 138 66 132 61 122 Z" fill="#020810" />
        <path d="M 84 144 L 87 164 L 80 164 L 77 147 Z" fill="#020810" />
        <path d="M 68 172 C 70 166 75 163 81 163 C 87 163 94 166 94 172 Z" fill="#020810" />
      </g>

      <!-- Left Standing Leg Base Chitin -->
      <!-- Thigh -->
      <path d="M 32 122 C 26 132 18 138 16 144 L 23 147 C 27 138 34 132 39 122 Z" fill="${chitinColor}" />
      <path d="M 30 124 C 25 132 20 137 18 143" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.32" fill="none" />
      <!-- Armored Knee Plate -->
      <ellipse cx="20" cy="145" rx="5" ry="3.8" fill="${chitinColor}" />
      <ellipse cx="20" cy="145" rx="2.8" ry="2" fill="#ffffff" opacity="0.25" />
      <!-- Shin / Crus -->
      <path d="M 16 144 L 13 164 L 20 164 L 23 147 Z" fill="${chitinColor}" />
      <path d="M 18 148 L 16 162" stroke="#ffffff" stroke-width="1.4" opacity="0.25" stroke-linecap="round" />
      <!-- Ankle Joint -->
      <ellipse cx="17" cy="164" rx="4.5" ry="2.2" fill="${chitinColor}" />
      <!-- Clawed Standing Boot Foot -->
      <path d="M 6 172 C 6 165 13 163 19 163 C 25 163 30 165 32 172 Z" fill="${chitinColor}" />
      <path d="M 6 172 L 32 172" stroke="#020810" stroke-width="1.5" opacity="0.4" />
      <!-- Toe Claws -->
      <path d="M 6 172 C 3 172 1 169 4 167 C 7 167 9 169 10 172 Z" fill="#ffffff" opacity="0.85" />
      <path d="M 28 172 C 30 169 33 167 35 169 C 34 172 32 172 28 172 Z" fill="#ffffff" opacity="0.85" />

      <!-- Right Standing Leg Base Chitin -->
      <!-- Thigh -->
      <path d="M 68 122 C 74 132 82 138 84 144 L 77 147 C 73 138 66 132 61 122 Z" fill="${chitinColor}" />
      <path d="M 70 124 C 75 132 80 137 82 143" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.32" fill="none" />
      <!-- Armored Knee Plate -->
      <ellipse cx="80" cy="145" rx="5" ry="3.8" fill="${chitinColor}" />
      <ellipse cx="80" cy="145" rx="2.8" ry="2" fill="#ffffff" opacity="0.25" />
      <!-- Shin / Crus -->
      <path d="M 84 144 L 87 164 L 80 164 L 77 147 Z" fill="${chitinColor}" />
      <path d="M 82 148 L 84 162" stroke="#ffffff" stroke-width="1.4" opacity="0.25" stroke-linecap="round" />
      <!-- Ankle Joint -->
      <ellipse cx="83" cy="164" rx="4.5" ry="2.2" fill="${chitinColor}" />
      <!-- Clawed Standing Boot Foot -->
      <path d="M 68 172 C 70 165 75 163 81 163 C 87 163 94 165 94 172 Z" fill="${chitinColor}" />
      <path d="M 68 172 L 94 172" stroke="#020810" stroke-width="1.5" opacity="0.4" />
      <!-- Toe Claws -->
      <path d="M 65 169 C 67 167 70 169 72 172 C 68 172 66 172 65 169 Z" fill="#ffffff" opacity="0.85" />
      <path d="M 90 172 C 91 169 93 167 96 167 C 99 169 97 172 94 172 Z" fill="#ffffff" opacity="0.85" />
    </g>`

  // Massive, Robust Anthropomorphic Abdominal Pleon Somites (Full-width torso)
  const abdomenLayer = `
    <g id="lobster-abdomen-layer">
      <!-- Somite 5 / Armored Pelvic Girdle (Broad solid base) -->
      <path d="M 20 122 C 18 131 22 137 28 137 L 72 137 C 78 137 82 131 80 122 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M 20 122 C 18 131 22 137 28 137 L 72 137 C 78 137 82 131 80 122 Z" fill="${chitinColor}" />
      <path d="M 24 126 C 36 133 64 133 76 126" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.32" />
      <ellipse cx="50" cy="130" rx="9" ry="3.5" fill="#ffffff" opacity="0.2" />

      <!-- Somite 4 (Waist / Belt somite) -->
      <path d="M 18 113 C 16 122 20 127 25 127 L 75 127 C 80 127 84 122 82 113 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M 18 113 C 16 122 20 127 25 127 L 75 127 C 80 127 84 122 82 113 Z" fill="${chitinColor}" />
      <path d="M 22 117 C 34 123 66 123 78 117" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.32" />

      <!-- Somite 3 (Lower midsection) -->
      <path d="M 16 104 C 14 112 18 117 23 117 L 77 117 C 82 117 86 112 84 104 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M 16 104 C 14 112 18 117 23 117 L 77 117 C 82 117 86 112 84 104 Z" fill="${chitinColor}" />
      <path d="M 20 108 C 34 114 66 114 80 108" stroke="#ffffff" stroke-width="2.6" fill="none" opacity="0.32" />

      <!-- Somite 2 (Mid abdominal arch) -->
      <path d="M 15 95 C 13 103 17 108 22 108 L 78 108 C 83 108 87 103 85 95 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M 15 95 C 13 103 17 108 22 108 L 78 108 C 83 108 87 103 85 95 Z" fill="${chitinColor}" />
      <path d="M 19 99 C 34 105 66 105 81 99" stroke="#ffffff" stroke-width="2.8" fill="none" opacity="0.32" />

      <!-- Somite 1 (Upper thorax transition - wide robust carapace base) -->
      <path d="M 14 86 C 12 94 16 99 22 99 L 78 99 C 84 99 88 94 86 86 Z" fill="#020810" opacity="0.2" transform="translate(1, 1.5)" />
      <path d="M 14 86 C 12 94 16 99 22 99 L 78 99 C 84 99 88 94 86 86 Z" fill="${chitinColor}" />
      <path d="M 18 90 C 34 96 66 96 82 90" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.32" />

      <!-- Central Dorsal Keel Highlight -->
      <path d="M 50 88 L 50 134" stroke="#ffffff" stroke-width="2.4" opacity="0.28" stroke-linecap="round" />
    </g>`

  const armsLayer = `
    <g id="lobster-arms-layer" data-pose="${pose.name}">
      <!-- Arm Shadows behind body -->
      <g opacity="0.22" transform="translate(1.5, 2)">
        <path d="${pose.leftArm}" fill="#020810" />
        <path d="${pose.rightArm}" fill="#020810" />
      </g>
      <!-- Base Arm Tubes -->
      <path d="${pose.leftArm}" fill="${chitinColor}" />
      <path d="${pose.rightArm}" fill="${chitinColor}" />
    </g>`

  const clawsLayer = `
    <g id="lobster-claws-layer">
      ${renderClawElement(pose.leftClaw, chitinColor)}
      ${renderClawElement(pose.rightClaw, chitinColor)}
    </g>`

  const browLayer = `
    <g id="lobster-brow-layer">
      <!-- Left & Right sculpted cartoon chitin eyebrows -->
      <path d="${leftEyebrow}" stroke="#020810" stroke-width="2.5" stroke-linecap="round" opacity="0.22" />
      <path d="${leftEyebrow}" stroke="${chitinColor}" stroke-width="1.8" stroke-linecap="round" />
      <path d="${rightEyebrow}" stroke="#020810" stroke-width="2.5" stroke-linecap="round" opacity="0.22" />
      <path d="${rightEyebrow}" stroke="${chitinColor}" stroke-width="1.8" stroke-linecap="round" />
    </g>`

  let outputSvg = rawSvg

  // 1. Expand ViewBox from 0 0 100 100 to tightly framed square character frame (housing side tails, claws, and antennas with balanced margins)
  outputSvg = outputSvg.replace('viewBox="0 0 100 100"', 'viewBox="-65 -38 230 230"')
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

  // 7. Layer claws, brow ridge, and modular antennae on TOP of the carapace and facial plane
  const endGIndex = outputSvg.lastIndexOf('</g></svg>')
  if (endGIndex !== -1) {
    outputSvg = outputSvg.slice(0, endGIndex) + clawsLayer + browLayer + antennaeLayer + outputSvg.slice(endGIndex)
  }

  return outputSvg
}

export function generateLobsterAvatarSvg(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const avatar = new Avatar(crittersStyle, {
    seed: config.seed,
    size,
    ...LOBSTER_CRUSTACEAN_OPTIONS,
  })
  const rawSvg = avatar.toString()
  return injectLobsterChitinLayers(rawSvg, config)
}

export function generateLobsterAvatarDataUri(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const svg = generateLobsterAvatarSvg(config, size)
  if (!svg) return null
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
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
