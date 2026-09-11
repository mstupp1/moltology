import { CANONICAL_SCRIPTURES, type ScriptureItem } from './codexData'

export const ISOLATION_PROTOCOLS_TITLE = 'The Isolation Protocols'

/** Stable path segment for a catalog id such as SCR-010 → scr-010. */
export function scriptureSlugFromId(id: string): string {
  return id.trim().toLowerCase()
}

export function normalizeScriptureSlug(raw: string): string {
  return raw.trim().toLowerCase()
}

export function findScriptureBySlug(slug: string | undefined | null): ScriptureItem | undefined {
  const normalized = normalizeScriptureSlug(slug ?? '')
  if (!normalized) return undefined
  return CANONICAL_SCRIPTURES.find((scripture) => scriptureSlugFromId(scripture.id) === normalized)
}

export function isolationProtocolsScripture(): ScriptureItem | undefined {
  return CANONICAL_SCRIPTURES.find((scripture) => scripture.title === ISOLATION_PROTOCOLS_TITLE)
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
