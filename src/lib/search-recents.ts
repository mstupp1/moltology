/**
 * Per-member search overlay Recents.
 *
 * Destinations and queries the member actually opened. Client-local, keyed by
 * member id. No schema, no Neon write. Guests never read or write a trail.
 */

import {
  COMMAND_CATEGORIES,
  findCatalogCommand,
  parseSearchTab,
  type CommandCatalogItem,
  type CommandCategory,
  type CommandIconId,
  type CommandNavTo,
  type SearchTab,
} from './command-catalog'
import type { MemberSearchResult } from './connections'

export const SEARCH_RECENTS_STORAGE_PREFIX = 'moltology:search:recents:'
export const SEARCH_RECENTS_LIMIT = 6
export const SEARCH_RECENTS_QUERY_MAX = 80

const COMMAND_ICONS = new Set<CommandIconId>([
  'dashboard',
  'codex',
  'lectures',
  'market',
  'subterranean',
  'pipeline',
  'journal',
  'forum',
  'stream',
  'landing',
  'support',
  'purge',
  'scan',
  'oracle',
  'connections',
  'chassis',
  'isolation',
  'news',
  'watch',
  'settings',
  'profile',
])

export type SearchRecentQuery = {
  kind: 'query'
  query: string
  type: SearchTab
  openedAt: number
}

export type SearchRecentPerson = {
  kind: 'person'
  memberId: string
  handle: string | null
  displayName: string
  larvaId: string
  stage: number
  stageLabel: string
  avatarConfig: { style: string; seed: string } | null
  openedAt: number
}

export type SearchRecentPage = {
  kind: 'page'
  commandId: string
  label: string
  category: CommandCategory
  icon: CommandIconId
  to?: CommandNavTo
  params?: Record<string, string>
  toast?: {
    id: string
    title: string
    message: string
  }
  openedAt: number
}

export type SearchRecentEntry = SearchRecentQuery | SearchRecentPerson | SearchRecentPage

export function searchRecentsStorageKey(userId: string): string {
  return `${SEARCH_RECENTS_STORAGE_PREFIX}${userId}`
}

export function normalizeRecentQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, SEARCH_RECENTS_QUERY_MAX)
}

export function searchRecentDedupeKey(entry: SearchRecentEntry): string {
  if (entry.kind === 'query') return `query:${entry.query.toLowerCase()}`
  if (entry.kind === 'person') return `person:${entry.memberId}`
  return `page:${entry.commandId}`
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isAvatarConfig(value: unknown): value is { style: string; seed: string } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.style === 'string' && typeof record.seed === 'string'
}

function isCategory(value: unknown): value is CommandCategory {
  return typeof value === 'string' && (COMMAND_CATEGORIES as readonly string[]).includes(value)
}

function isIcon(value: unknown): value is CommandIconId {
  return typeof value === 'string' && COMMAND_ICONS.has(value as CommandIconId)
}

function isFiniteOpenedAt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isQueryRecent(value: unknown): value is SearchRecentQuery {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.kind !== 'query') return false
  if (typeof record.query !== 'string' || !normalizeRecentQuery(record.query)) return false
  if (!isFiniteOpenedAt(record.openedAt)) return false
  return record.type === 'people' || record.type === 'pages'
}

function isPersonRecent(value: unknown): value is SearchRecentPerson {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.kind !== 'person') return false
  if (typeof record.memberId !== 'string' || !record.memberId.trim()) return false
  if (typeof record.displayName !== 'string' || !record.displayName.trim()) return false
  if (typeof record.larvaId !== 'string') return false
  if (typeof record.stage !== 'number' || !Number.isFinite(record.stage)) return false
  if (typeof record.stageLabel !== 'string') return false
  if (!isFiniteOpenedAt(record.openedAt)) return false
  if (record.handle != null && typeof record.handle !== 'string') return false
  if (record.avatarConfig != null && !isAvatarConfig(record.avatarConfig)) return false
  return true
}

function isPageRecent(value: unknown): value is SearchRecentPage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.kind !== 'page') return false
  if (typeof record.commandId !== 'string' || !record.commandId.trim()) return false
  if (typeof record.label !== 'string' || !record.label.trim()) return false
  if (!isCategory(record.category) || !isIcon(record.icon)) return false
  if (!isFiniteOpenedAt(record.openedAt)) return false
  return true
}

function isRecentEntry(value: unknown): value is SearchRecentEntry {
  return isQueryRecent(value) || isPersonRecent(value) || isPageRecent(value)
}

function sanitizeQueryRecent(entry: SearchRecentQuery): SearchRecentQuery {
  return {
    kind: 'query',
    query: normalizeRecentQuery(entry.query),
    type: parseSearchTab(entry.type),
    openedAt: entry.openedAt,
  }
}

function sanitizePersonRecent(entry: SearchRecentPerson): SearchRecentPerson {
  return {
    kind: 'person',
    memberId: entry.memberId.trim(),
    handle: entry.handle?.trim() || null,
    displayName: entry.displayName.trim(),
    larvaId: entry.larvaId.trim(),
    stage: entry.stage,
    stageLabel: entry.stageLabel,
    avatarConfig: isAvatarConfig(entry.avatarConfig) ? entry.avatarConfig : null,
    openedAt: entry.openedAt,
  }
}

function sanitizePageRecent(entry: SearchRecentPage): SearchRecentPage {
  const next: SearchRecentPage = {
    kind: 'page',
    commandId: entry.commandId.trim(),
    label: entry.label.trim(),
    category: entry.category,
    icon: entry.icon,
    openedAt: entry.openedAt,
  }
  if (entry.to) next.to = entry.to
  if (entry.params) next.params = entry.params
  if (entry.toast) next.toast = entry.toast
  return next
}

function sanitizeEntry(entry: SearchRecentEntry): SearchRecentEntry | null {
  if (entry.kind === 'query') {
    const next = sanitizeQueryRecent(entry)
    return next.query ? next : null
  }
  if (entry.kind === 'person') return sanitizePersonRecent(entry)
  return sanitizePageRecent(entry)
}

export function getSearchRecents(userId: string | null | undefined): SearchRecentEntry[] {
  if (!userId || !canUseLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(searchRecentsStorageKey(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const next: SearchRecentEntry[] = []
    for (const item of parsed) {
      if (!isRecentEntry(item)) continue
      const clean = sanitizeEntry(item)
      if (!clean) continue
      const key = searchRecentDedupeKey(clean)
      if (seen.has(key)) continue
      seen.add(key)
      next.push(clean)
      if (next.length >= SEARCH_RECENTS_LIMIT) break
    }
    return next
  } catch {
    return []
  }
}

function persistSearchRecents(userId: string, entries: SearchRecentEntry[]): void {
  if (!canUseLocalStorage()) return
  try {
    window.localStorage.setItem(searchRecentsStorageKey(userId), JSON.stringify(entries))
  } catch {
    // Ignore quota / privacy-mode write failures
  }
}

export function rememberSearchRecent(
  userId: string | null | undefined,
  draft: SearchRecentEntry,
): SearchRecentEntry[] {
  if (!userId) return []
  const clean = isRecentEntry(draft) ? sanitizeEntry(draft) : null
  if (!clean) return getSearchRecents(userId)

  const existing = getSearchRecents(userId)
  const key = searchRecentDedupeKey(clean)
  const next = [clean, ...existing.filter((entry) => searchRecentDedupeKey(entry) !== key)].slice(
    0,
    SEARCH_RECENTS_LIMIT,
  )
  persistSearchRecents(userId, next)
  return next
}

export function rememberOpenedQuery(
  userId: string | null | undefined,
  query: string,
  type: SearchTab,
): SearchRecentEntry[] {
  const normalized = normalizeRecentQuery(query)
  if (!userId || !normalized) return getSearchRecents(userId)
  return rememberSearchRecent(userId, {
    kind: 'query',
    query: normalized,
    type: parseSearchTab(type),
    openedAt: Date.now(),
  })
}

export function rememberOpenedPerson(
  userId: string | null | undefined,
  member: MemberSearchResult,
): SearchRecentEntry[] {
  if (!userId || !member.id.trim()) return getSearchRecents(userId)
  return rememberSearchRecent(userId, {
    kind: 'person',
    memberId: member.id,
    handle: member.handle,
    displayName: member.displayName,
    larvaId: member.larvaId,
    stage: member.stage,
    stageLabel: member.stageLabel,
    avatarConfig: isAvatarConfig(member.avatarConfig) ? member.avatarConfig : null,
    openedAt: Date.now(),
  })
}

export function rememberOpenedPage(
  userId: string | null | undefined,
  command: CommandCatalogItem,
): SearchRecentEntry[] {
  if (!userId || !command.id.trim()) return getSearchRecents(userId)
  return rememberSearchRecent(userId, {
    kind: 'page',
    commandId: command.id,
    label: command.label,
    category: command.category,
    icon: command.icon,
    to: command.to,
    params: command.params,
    toast: command.toast,
    openedAt: Date.now(),
  })
}

export function clearSearchRecents(userId: string | null | undefined): SearchRecentEntry[] {
  if (!userId || !canUseLocalStorage()) return []
  try {
    window.localStorage.removeItem(searchRecentsStorageKey(userId))
  } catch {
    // Ignore storage access failures
  }
  return []
}

export function personFromRecent(entry: SearchRecentPerson): MemberSearchResult {
  return {
    id: entry.memberId,
    larvaId: entry.larvaId,
    handle: entry.handle,
    displayName: entry.displayName,
    stage: entry.stage,
    stageLabel: entry.stageLabel,
    avatarConfig: entry.avatarConfig,
  }
}

export function pageFromRecent(entry: SearchRecentPage): CommandCatalogItem {
  const live = findCatalogCommand(entry.commandId)
  if (live) return live
  return {
    id: entry.commandId,
    label: entry.label,
    category: entry.category,
    icon: entry.icon,
    to: entry.to,
    params: entry.params,
    toast: entry.toast,
  }
}
