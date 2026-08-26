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

export function generateLobsterAvatarSvg(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const avatar = new Avatar(crittersStyle, { seed: config.seed, size })
  return avatar.toString()
}

export function generateLobsterAvatarDataUri(
  config: LobsterAvatarConfig,
  size = 256
): string | null {
  const avatar = new Avatar(crittersStyle, { seed: config.seed, size })
  return avatar.toDataUri()
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
