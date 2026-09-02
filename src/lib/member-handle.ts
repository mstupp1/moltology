/**
 * Member designations (internal: usernames).
 *
 * `profiles.handle` is the chosen public name. `profiles.larvaId` stays the
 * unique unit label from PR 35. Forum / hub / profile chrome prefer handle,
 * then the member's larva unit. Never invent Ellis-style names from auth.
 */

import { resolveMemberLarvaId } from './larva-id'

export const HANDLE_MIN_LENGTH = 3
export const HANDLE_MAX_LENGTH = 20
export const HANDLE_CHARSET = /^[A-Za-z0-9_]+$/

/** Exact reserved designations (case-insensitive). */
export const RESERVED_HANDLES = new Set([
  'moltology',
  'oracle',
  'admin',
  'root',
  'system',
  'administrator',
  'moderator',
  'official',
  'support',
  'staff',
  'security',
  'help',
  'superadmin',
  'super_admin',
  'synaptic',
  'carcinus',
  'guest',
  'anonymous',
  'everyone',
  'nobody',
  'null',
  'undefined',
  'owner',
  'founder',
  'synaptic_oracle',
  'high_ascendant',
  'the_order',
])

/** Stems that look like Order impersonation when followed by _ or digits. */
export const RESERVED_IMPERSONATION_STEMS = [
  'moltology',
  'oracle',
  'admin',
  'root',
  'system',
  'official',
  'moderator',
] as const

export type HandleValidationCode =
  | 'empty'
  | 'length'
  | 'charset'
  | 'space'
  | 'slash'
  | 'reserved'

export type ParsedMemberHandle =
  | { ok: true; handle: string }
  | { ok: false; code: HandleValidationCode; message: string }

export const HANDLE_MESSAGES: Record<HandleValidationCode, string> = {
  empty: 'Username is required.',
  length: 'Usernames must be 3 to 20 characters.',
  charset: 'Letters, numbers, and underscore only. No special characters.',
  space: 'Usernames cannot contain spaces.',
  slash: 'Usernames cannot contain slashes or special characters.',
  reserved: 'That username is reserved.',
}

export const HANDLE_TAKEN_MESSAGE = 'That username is already taken.'

export function normalizeHandleForCompare(value: string): string {
  return value.trim().toLowerCase()
}

export function isReservedHandle(value: string): boolean {
  const normalized = normalizeHandleForCompare(value)
  if (!normalized) return false
  if (RESERVED_HANDLES.has(normalized)) return true
  return RESERVED_IMPERSONATION_STEMS.some((stem) => {
    if (normalized === stem) return true
    if (normalized.startsWith(`${stem}_`)) return true
    return new RegExp(`^${stem}\\d+$`).test(normalized)
  })
}

/**
 * Validate a raw designation. Rejects rather than silently coercing.
 * Leading and trailing whitespace is ignored as form hygiene; internal
 * spaces, slashes, and other marks fail out loud.
 */
export function parseMemberHandle(raw: unknown): ParsedMemberHandle {
  if (typeof raw !== 'string') {
    return { ok: false, code: 'empty', message: HANDLE_MESSAGES.empty }
  }

  if (/\/\//.test(raw) || raw.includes('/')) {
    return { ok: false, code: 'slash', message: HANDLE_MESSAGES.slash }
  }

  if (/\s/.test(raw)) {
    return { ok: false, code: 'space', message: HANDLE_MESSAGES.space }
  }

  const handle = raw.trim()
  if (!handle) {
    return { ok: false, code: 'empty', message: HANDLE_MESSAGES.empty }
  }

  if (handle.length < HANDLE_MIN_LENGTH || handle.length > HANDLE_MAX_LENGTH) {
    return { ok: false, code: 'length', message: HANDLE_MESSAGES.length }
  }

  if (!HANDLE_CHARSET.test(handle)) {
    return { ok: false, code: 'charset', message: HANDLE_MESSAGES.charset }
  }

  if (isReservedHandle(handle)) {
    return { ok: false, code: 'reserved', message: HANDLE_MESSAGES.reserved }
  }

  return { ok: true, handle }
}

export function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  const message = String((error as { message?: string } | null)?.message || error || '')
  return (
    code === '23505' ||
    message.includes('profiles_handle_lower_uidx') ||
    /duplicate key/i.test(message)
  )
}

export function resolveMemberPublicName(input: {
  userId?: string | null
  handle?: string | null
  larvaId?: string | null
}): string {
  const handle = input.handle?.trim()
  if (handle) return handle
  return resolveMemberLarvaId(input.userId, input.larvaId)
}
