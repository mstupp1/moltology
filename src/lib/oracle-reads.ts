/**
 * Oracle reads: public site content the Oracle looked up while answering (forum topics,
 * a forum thread, news, the changelog, the Academy catalog, the Codex). Browser safe:
 * labels and the saved message part only. The tools live in src/lib/ai/oracle-read-tools.ts.
 */

/** Response header listing what the Oracle read, as URI-encoded JSON of OracleReadItem[]. */
export const ORACLE_READS_HEADER = 'x-oracle-reads'

export type OracleReadKind = 'forum-list' | 'forum-thread' | 'news' | 'changelog' | 'academy' | 'codex'

/** One lookup and what it returned. */
export interface OracleReadItem {
  kind: OracleReadKind
  /** How many items the lookup returned (topics, articles, releases, courses, passages). */
  count: number
  /** Set when the lookup returned exactly one thing the member can open. */
  title?: string
  href?: string
  /**
   * What the lookup returned, in order, so the chat can show each one as a card:
   * forum topic slugs, news slugs, changelog slugs, Academy course slugs, or Codex
   * passage ids with an optional verse (`SCR-010` or `SCR-010#3`).
   */
  refs?: string[]
}

/** Saved on an assistant message's `parts`, so a reloaded chat keeps the label. */
export interface OracleReadsPart {
  type: 'reads'
  items: OracleReadItem[]
}

const KINDS = new Set<OracleReadKind>(['forum-list', 'forum-thread', 'news', 'changelog', 'academy', 'codex'])
const MAX_ITEMS = 6
/** Cards one lookup can show. */
export const ORACLE_READ_MAX_REFS = 8
const REF = /^[A-Za-z0-9][A-Za-z0-9-]{0,199}(?:#\d{1,4})?$/

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

function itemLabel(item: OracleReadItem): string {
  switch (item.kind) {
    case 'forum-list':
      return item.count ? `Read ${plural(item.count, 'forum topic', 'forum topics')}` : 'Checked the forum'
    case 'forum-thread':
      return 'Read a forum thread'
    case 'news':
      if (item.title && item.count === 1) return 'Read a news article'
      return item.count ? `Read ${plural(item.count, 'news article', 'news articles')}` : 'Checked the news'
    case 'changelog':
      return 'Read the changelog'
    case 'academy':
      return 'Checked the Academy'
    case 'codex':
      return 'Searched the Codex'
  }
}

/** One short line for the reply, such as "Read 5 forum topics · Read a forum thread". */
export function oracleReadsLabel(items: readonly OracleReadItem[]): string {
  const labels: string[] = []
  for (const item of items) {
    const label = itemLabel(item)
    if (!labels.includes(label)) labels.push(label)
  }
  return labels.join(' · ')
}

/** The one place the label can link to, when the Oracle read a single page. */
export function oracleReadsLink(items: readonly OracleReadItem[]): { title: string; href: string } | null {
  const linked = items.filter((item) => item.href && item.title)
  if (linked.length !== 1) return null
  const [only] = linked
  return { title: only.title!, href: only.href! }
}

function cleanItem(raw: unknown): OracleReadItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.kind !== 'string' || !KINDS.has(r.kind as OracleReadKind)) return null
  const count = typeof r.count === 'number' && Number.isFinite(r.count) ? Math.max(0, Math.floor(r.count)) : 0
  const href = typeof r.href === 'string' && r.href.startsWith('/') && !r.href.startsWith('//') ? r.href.slice(0, 300) : undefined
  const title = typeof r.title === 'string' ? r.title.slice(0, 160) : undefined
  const refs = Array.isArray(r.refs)
    ? [...new Set(r.refs.filter((ref): ref is string => typeof ref === 'string' && REF.test(ref)))].slice(0, ORACLE_READ_MAX_REFS)
    : []
  return {
    kind: r.kind as OracleReadKind,
    count,
    ...(href && title ? { href, title } : {}),
    ...(refs.length ? { refs } : {}),
  }
}

export function cleanReadItems(raw: unknown): OracleReadItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(cleanItem).filter((item): item is OracleReadItem => item !== null).slice(0, MAX_ITEMS)
}

const HEADER_MAX_CHARS = 6_000

export function encodeReadsHeader(items: readonly OracleReadItem[]): string {
  const kept = items.slice(0, MAX_ITEMS)
  const full = encodeURIComponent(JSON.stringify(kept))
  if (full.length <= HEADER_MAX_CHARS) return full
  // Too long for a header: keep the label, drop the cards (the saved message still has them).
  return encodeURIComponent(JSON.stringify(kept.map(({ refs: _refs, ...rest }) => rest)))
}

export function decodeReadsHeader(value: string | null | undefined): OracleReadItem[] {
  if (!value) return []
  try {
    return cleanReadItems(JSON.parse(decodeURIComponent(value)))
  } catch {
    return []
  }
}

export function readReadsPart(parts: unknown): OracleReadItem[] {
  if (!Array.isArray(parts)) return []
  const part = parts.find((p) => Boolean(p) && typeof p === 'object' && (p as { type?: unknown }).type === 'reads')
  return part ? cleanReadItems((part as { items?: unknown }).items) : []
}

/** Card references across a reply's lookups, grouped by what loads them. */
export interface OracleCardRefs {
  forum: string[]
  news: string[]
  changelog: string[]
  academy: string[]
  codex: string[]
}

export function collectCardRefs(items: readonly OracleReadItem[]): OracleCardRefs {
  const out: OracleCardRefs = { forum: [], news: [], changelog: [], academy: [], codex: [] }
  for (const item of items) {
    const bucket =
      item.kind === 'forum-list' || item.kind === 'forum-thread' ? out.forum
        : item.kind === 'news' ? out.news
          : item.kind === 'changelog' ? out.changelog
            : item.kind === 'academy' ? out.academy
              : out.codex
    for (const ref of item.refs ?? []) if (!bucket.includes(ref)) bucket.push(ref)
  }
  return out
}

export function hasCardRefs(refs: OracleCardRefs): boolean {
  return Object.values(refs).some((list) => list.length > 0)
}
