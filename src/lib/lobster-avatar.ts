import { Style, Avatar } from '@dicebear/core'
import type { StyleDefinition } from '@dicebear/core'
import critters from '@dicebear/styles/critters.json' with { type: 'json' }

export const LOBSTER_AVATAR_STYLE = 'critters' as const

export interface LobsterAvatarConfig {
  style: typeof LOBSTER_AVATAR_STYLE
  seed: string
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
  return { style: LOBSTER_AVATAR_STYLE, seed }
}

export function randomLobsterSeed(): string {
  const bytes = new Uint32Array(2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
    return `larva-${bytes[0].toString(36)}-${bytes[1].toString(36)}`
  }
  return `larva-${Math.random().toString(36).slice(2, 10)}`
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

  // 🦞 3. Red-Adjacent & Warm Underbelly Accent Palette
  accentColor: [
    'fed7aa', // Pale Tan Ribbed Underbelly Plates (Canonical)
    'fdba74', // Warm Peach Underbelly
    'fca5a5', // Soft Coral Underbelly
    'fde047', // Warm Amber Gold
    'f87171', // Light Crustacean Coral
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

  // 🦞 8. Deep Benthic Abyss Backgrounds (Terminal HUD Pop)
  backgroundColor: ['050b14', '071520', '0a141d', '061826', '091c28', '03141f'] as const,
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
 */
const CLAW_PATH =
  'M -6 2 C -10 2 -12 -4 -12 -12 C -12 -20 -8 -28 -2 -32 C 2 -34 6 -28 4 -20 C 2 -14 3 -8 6 -6 C 8 -8 14 -18 20 -14 C 24 -10 20 -2 14 2 C 10 6 4 8 0 8 C -4 8 -6 6 -6 2 Z'

/**
 * 4 Modular Crustacean Claw Poses
 * Clean arm trunks emerge beneath the carapace, with standalone lobster pincers stamped on top of wrists.
 * When arms are raised, claws point upward in a cheer. When arms are lowered, claws hang naturally downward/outward.
 */
const LOBSTER_CLAW_POSES: readonly ClawPose[] = [
  // 0: Dual Cheerful Raised Claws (Both open upwards at 45 deg)
  {
    name: 'dual_cheer',
    leftArm: 'M 38 78 C 24 76 16 68 12 56 C 8 50 14 44 20 48 C 24 56 30 72 38 84 Z',
    rightArm: 'M 62 78 C 76 76 84 68 88 56 C 92 50 86 44 80 48 C 76 56 70 72 62 84 Z',
    leftClaw: { x: 12, y: 46, rot: -25, scale: 0.85 },
    rightClaw: { x: 88, y: 46, rot: 25, scale: 0.85, flipX: true },
  },
  // 1: Right Wave / Victory (Right raised UP, Left lowered hanging naturally at side)
  {
    name: 'victory_right',
    leftArm: 'M 38 76 C 24 76 16 78 12 82 C 8 86 12 92 18 90 C 24 88 30 82 38 84 Z',
    rightArm: 'M 62 78 C 76 76 86 64 90 48 C 94 42 88 38 82 42 C 78 54 70 74 62 86 Z',
    leftClaw: { x: 10, y: 84, rot: -100, scale: 0.75 },
    rightClaw: { x: 90, y: 38, rot: 30, scale: 0.85, flipX: true },
  },
  // 2: Left Wave / Victory (Left raised UP, Right lowered hanging naturally at side)
  {
    name: 'victory_left',
    leftArm: 'M 38 78 C 24 76 14 64 10 48 C 6 42 12 38 18 42 C 22 54 30 74 38 86 Z',
    rightArm: 'M 62 76 C 76 76 84 78 88 82 C 92 86 88 92 82 90 C 76 88 70 82 62 84 Z',
    leftClaw: { x: 10, y: 38, rot: -30, scale: 0.85 },
    rightClaw: { x: 90, y: 84, rot: 100, scale: 0.75, flipX: true },
  },
  // 3: Hip Rest / Lowered (Both arms relaxed, both claws hanging naturally at sides)
  {
    name: 'hip_rest',
    leftArm: 'M 38 76 C 24 76 16 78 12 82 C 8 86 12 92 18 90 C 24 88 30 82 38 84 Z',
    rightArm: 'M 62 76 C 76 76 84 78 88 82 C 92 86 88 92 82 90 C 76 88 70 82 62 84 Z',
    leftClaw: { x: 10, y: 84, rot: -100, scale: 0.75 },
    rightClaw: { x: 90, y: 84, rot: 100, scale: 0.75, flipX: true },
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
      <!-- Joint collar at base -->
      <ellipse cx="0" cy="6" rx="7" ry="3.5" fill="${color}" opacity="0.9" />
      <ellipse cx="0" cy="6" rx="7" ry="3.5" fill="none" stroke="#020810" stroke-width="1.5" opacity="0.2" />
      <!-- Specular Highlight on Big Sickle Claw -->
      <ellipse cx="-5" cy="-16" rx="2.5" ry="7" fill="#ffffff" opacity="0.32" transform="rotate(-15 -5 -16)" />
    </g>`
}

/**
 * Injects articulated lobster pincers, specular highlights, and a sculpted chitin brow ridge
 * into the generated DiceBear SVG.
 */
function injectLobsterChitinLayers(rawSvg: string, seed: string): string {
  // Extract generated chitin shell fill color from SVG or fallback to canonical coral red
  const colorMatch = rawSvg.match(/fill="(#(?:c2410c|be123c|ea580c|dc2626|b91c1c|991b1b|e11d48|f97316))"/i)
  const chitinColor = colorMatch ? colorMatch[1] : '#c2410c'

  // Deterministic seed hash for 4 distinct claw pose variations
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
  }
  const poseIndex = Math.abs(hash) % LOBSTER_CLAW_POSES.length
  const pose = LOBSTER_CLAW_POSES[poseIndex]

  // Subtle curved cartoon eyebrows positioned right above the orbital eye sockets
  const leftEyebrow = 'M 31 35 Q 37 31 43 35'
  const rightEyebrow = 'M 57 35 Q 63 31 69 35'

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

  // Layer arm segments behind the body carapace so roots tuck under the shell
  const bodyUseIndex = outputSvg.indexOf('<use href="#body-')
  if (bodyUseIndex !== -1) {
    outputSvg = outputSvg.slice(0, bodyUseIndex) + armsLayer + outputSvg.slice(bodyUseIndex)
  } else {
    const insertIndex = outputSvg.lastIndexOf('</g></svg>')
    outputSvg = outputSvg.slice(0, insertIndex) + armsLayer + outputSvg.slice(insertIndex)
  }

  // Layer claws and brow ridge on TOP of the arms & facial plane
  const endGIndex = outputSvg.lastIndexOf('</g></svg>')
  if (endGIndex !== -1) {
    outputSvg = outputSvg.slice(0, endGIndex) + clawsLayer + browLayer + outputSvg.slice(endGIndex)
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
  return injectLobsterChitinLayers(rawSvg, config.seed)
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
