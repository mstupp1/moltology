import {
  generateLobsterAvatarDataUri,
  type LobsterAvatarConfig,
  type LobsterAvatarFrame,
} from './lobster-avatar'

export type { LobsterAvatarFrame }

/** Call sites pick a slot. Never `isAnimated && crop`. */
export const LOBSTER_AVATAR_SLOTS = ['portrait', 'fullBody'] as const
export type LobsterAvatarSlot = (typeof LOBSTER_AVATAR_SLOTS)[number]

/**
 * Motion tech already in use: inline SVG + CSS idle layers.
 * Other kinds exist so a future swap does not invent a second crop path.
 */
export const LOBSTER_FULL_BODY_KINDS = ['svg'] as const
export type LobsterFullBodyKind = (typeof LOBSTER_FULL_BODY_KINDS)[number]

export interface LobsterFullBodyAsset {
  url: string
  kind: LobsterFullBodyKind
}

export interface LobsterAvatarAssets {
  portraitUrl: string | null
  fullBody: LobsterFullBodyAsset | null
}

export type PickedLobsterAvatar =
  | { slot: 'portrait'; url: string }
  | { slot: 'fullBody'; url: string; kind: LobsterFullBodyKind }

/** CSS px we optimize for. Sources ship at 2×. */
export const LOBSTER_PORTRAIT_DISPLAY_PX = { sm: 64, lg: 128 } as const
export const LOBSTER_PORTRAIT_SOURCE_PX = { sm: 128, lg: 256 } as const

export type LobsterPortraitSourcePx =
  (typeof LOBSTER_PORTRAIT_SOURCE_PX)[keyof typeof LOBSTER_PORTRAIT_SOURCE_PX]

/** Map on-screen CSS px to one of the two shipped source sizes. */
export function portraitSourcePxForCssPx(cssPx: number): LobsterPortraitSourcePx {
  return cssPx <= LOBSTER_PORTRAIT_DISPLAY_PX.sm
    ? LOBSTER_PORTRAIT_SOURCE_PX.sm
    : LOBSTER_PORTRAIT_SOURCE_PX.lg
}

/** Clamp a requested generation size onto the two shipped portrait sources. */
export function normalizePortraitSourcePx(requested?: number): LobsterPortraitSourcePx {
  if (requested == null || requested <= LOBSTER_PORTRAIT_SOURCE_PX.sm) {
    return LOBSTER_PORTRAIT_SOURCE_PX.sm
  }
  return LOBSTER_PORTRAIT_SOURCE_PX.lg
}

function stillPortraitConfig(config: LobsterAvatarConfig): LobsterAvatarConfig {
  return {
    ...config,
    backgroundMotion: 'static',
    patternPulse: 'steady',
    patternSparkles: 'none',
  }
}

export function resolveLobsterAvatarAssets(
  config: LobsterAvatarConfig | null | undefined,
  options?: { portraitSize?: number; fullBodySize?: number }
): LobsterAvatarAssets {
  if (!config?.seed) {
    return { portraitUrl: null, fullBody: null }
  }

  const portraitSize = normalizePortraitSourcePx(options?.portraitSize)
  const fullBodySize = options?.fullBodySize ?? 256

  const portraitUrl = generateLobsterAvatarDataUri(stillPortraitConfig(config), portraitSize, {
    frame: 'portrait',
    staticMotion: true,
  })

  const fullBodyUrl = generateLobsterAvatarDataUri(config, fullBodySize, {
    frame: 'fullBody',
    staticMotion: false,
  })

  return {
    portraitUrl,
    fullBody: fullBodyUrl ? { url: fullBodyUrl, kind: 'svg' } : null,
  }
}

export function pickLobsterAvatarSlot(
  assets: LobsterAvatarAssets,
  slot: LobsterAvatarSlot
): PickedLobsterAvatar | null {
  if (slot === 'portrait') {
    return assets.portraitUrl ? { slot: 'portrait', url: assets.portraitUrl } : null
  }
  if (assets.fullBody?.url) {
    return { slot: 'fullBody', url: assets.fullBody.url, kind: assets.fullBody.kind }
  }
  return null
}

export function isLobsterAvatarSlot(value: unknown): value is LobsterAvatarSlot {
  return value === 'portrait' || value === 'fullBody'
}

/** At most one animated full-body instance may hold the motion lease. */
let fullBodyMotionLeases = 0

export function acquireLobsterFullBodyMotion(): boolean {
  if (fullBodyMotionLeases >= 1) return false
  fullBodyMotionLeases += 1
  return true
}

export function releaseLobsterFullBodyMotion(): void {
  fullBodyMotionLeases = Math.max(0, fullBodyMotionLeases - 1)
}

export function resetLobsterFullBodyMotionForTests(): void {
  fullBodyMotionLeases = 0
}

export function getLobsterFullBodyMotionLeaseCountForTests(): number {
  return fullBodyMotionLeases
}
