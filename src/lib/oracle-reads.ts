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
}

/** Saved on an assistant message's `parts`, so a reloaded chat keeps the label. */
export interface OracleReadsPart {
  type: 'reads'
  items: OracleReadItem[]
}

const KINDS = new Set<OracleReadKind>(['forum-list', 'forum-thread', 'news', 'changelog', 'academy', 'codex'])
const MAX_ITEMS = 6

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
  return { kind: r.kind as OracleReadKind, count, ...(href && title ? { href, title } : {}) }
}

export function cleanReadItems(raw: unknown): OracleReadItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(cleanItem).filter((item): item is OracleReadItem => item !== null).slice(0, MAX_ITEMS)
}

export function encodeReadsHeader(items: readonly OracleReadItem[]): string {
  return encodeURIComponent(JSON.stringify(items.slice(0, MAX_ITEMS)))
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
