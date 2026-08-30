/**
 * Per-member unit labels for forum attribution.
 *
 * The profiles.larvaId column defaults to the seed larva's number. Every real
 * member who signed up inherited that same label, so distinct user ids still
 * rendered as one identity on a thread. Keep the existing "LARVA UNIT #NNNN"
 * scheme — assign a stable unique number per member id. Do not substitute
 * auth display names.
 */

export const SEED_LARVA_PROFILE_ID = '00000000-0000-0000-0000-000000000001'
export const PLACEHOLDER_LARVA_ID = 'LARVA UNIT #8971'

/** Seed larva unit. Real members must not reuse this number. */
const RESERVED_LARVA_UNIT_NUMBERS = new Set([8971])

export function isPlaceholderLarvaId(value?: string | null): boolean {
  if (!value) return true
  return value.trim().toUpperCase() === PLACEHOLDER_LARVA_ID
}

export function formatLarvaUnit(n: number): string {
  return `LARVA UNIT #${String(n).padStart(4, '0')}`
}

/** Stable 4-digit unit in 1000–9999, skipping the seed larva number. */
export function deriveLarvaUnitNumber(userId: string): number {
  let hash = 2166136261
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  let n = ((hash >>> 0) % 9000) + 1000
  for (let i = 0; i < 9000; i++) {
    if (!RESERVED_LARVA_UNIT_NUMBERS.has(n)) return n
    n = n === 9999 ? 1000 : n + 1
  }
  return n
}

/**
 * Unit label for a member on a forum row.
 *
 * - No user id (seed / anonymous row): keep the stored name.
 * - Seed larva profile: keep the canonical placeholder.
 * - Stored custom / already-unique label: keep it.
 * - Shared placeholder on a real member: derive that member's unit number.
 */
export function resolveMemberLarvaId(
  userId?: string | null,
  storedLarvaId?: string | null,
): string {
  if (!userId) {
    return storedLarvaId?.trim() || PLACEHOLDER_LARVA_ID
  }
  if (userId === SEED_LARVA_PROFILE_ID) {
    return storedLarvaId?.trim() || PLACEHOLDER_LARVA_ID
  }
  if (storedLarvaId && !isPlaceholderLarvaId(storedLarvaId)) {
    return storedLarvaId
  }
  return formatLarvaUnit(deriveLarvaUnitNumber(userId))
}

export function shouldReplacePlaceholderLarvaId(
  userId?: string | null,
  storedLarvaId?: string | null,
): boolean {
  if (!userId || userId === SEED_LARVA_PROFILE_ID) return false
  return isPlaceholderLarvaId(storedLarvaId)
}
