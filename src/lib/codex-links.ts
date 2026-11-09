import { SCRIPTURE_CATALOG, type ScriptureSummary } from './codexCatalog'

export const ISOLATION_PROTOCOLS_TITLE = 'The Isolation Protocols'

/** Stable path segment for a catalog id such as SCR-010 → scr-010. */
export function scriptureSlugFromId(id: string): string {
  return id.trim().toLowerCase()
}

export function normalizeScriptureSlug(raw: string): string {
  return raw.trim().toLowerCase()
}

export function findScriptureBySlug(slug: string | undefined | null): ScriptureSummary | undefined {
  const normalized = normalizeScriptureSlug(slug ?? '')
  if (!normalized) return undefined
  return SCRIPTURE_CATALOG.find((scripture) => scriptureSlugFromId(scripture.id) === normalized)
}

export function isolationProtocolsScripture(): ScriptureSummary | undefined {
  return SCRIPTURE_CATALOG.find((scripture) => scripture.title === ISOLATION_PROTOCOLS_TITLE)
}

export function isolationProtocolsSlug(): string {
  const scripture = isolationProtocolsScripture()
  return scriptureSlugFromId(scripture?.id ?? 'SCR-031')
}

export function codexScriptureLocation(slug: string): {
  to: '/codex/$slug'
  params: { slug: string }
} {
  return {
    to: '/codex/$slug',
    params: { slug: normalizeScriptureSlug(slug) },
  }
}

/** Element id for one verse section, so links such as /codex/scr-030#verse-3 land on it. */
export function codexVerseAnchor(verseNumber: number): string {
  return `verse-${verseNumber}`
}

/** Verse number from a location hash such as #verse-3, or undefined. */
export function verseNumberFromHash(hash: string | undefined | null): number | undefined {
  const match = (hash ?? '').replace(/^#/, '').match(/^verse-(\d+)$/)
  return match ? Number(match[1]) : undefined
}
