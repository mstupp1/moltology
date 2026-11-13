import { useEffect } from 'react'
import { avatarStillHash, STORED_STILL_PX } from '@/lib/avatar-still'
import { requestStill3D } from '@/lib/avatar3d-portrait-queue'
import { getAuthJWTToken } from '@/lib/jwt'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

const tried = new Set<string>()
const RETRY_AFTER_MS = 24 * 60 * 60 * 1000
const memo = (hash: string) => `moltology:avatar-still-tried:${hash}`

function triedLately(hash: string): boolean {
  if (tried.has(hash)) return true
  try {
    return Date.now() - Number(localStorage.getItem(memo(hash)) ?? 0) < RETRY_AFTER_MS
  } catch {
    return false
  }
}

/**
 * Keeps the signed-in member's stored portrait up to date. When their character has no stored
 * picture for its current look, this draws one once the page has settled and sends it to be
 * stored, so every other browser can show a plain image instead of drawing the character.
 */
export function useAvatarStillSync(userId: string | null | undefined, config: LobsterAvatarConfig | null | undefined): void {
  const key = config?.seed ? JSON.stringify(config) : null
  useEffect(() => {
    if (!userId || !key) return
    const look = JSON.parse(key) as LobsterAvatarConfig
    const hash = avatarStillHash(look)
    if (!hash || look.still === hash || triedLately(hash)) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      tried.add(hash)
      try {
        const url = await requestStill3D(look, STORED_STILL_PX, 'portrait')
        // Browsers that cannot write WebP hand back a PNG, which is not stored.
        if (cancelled || !url?.startsWith('data:image/webp')) return
        const token = await getAuthJWTToken()
        const { saveAvatarStillFn } = await import('@/lib/server/api')
        const result = await saveAvatarStillFn({ data: { userId, token: token ?? undefined, image: url } })
        if (result.still) window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
        else localStorage.setItem(memo(hash), String(Date.now()))
      } catch {
        // Not stored this time: the character is still drawn in the browser as before.
      }
    }, 2500)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [userId, key])
}
