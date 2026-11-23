/**
 * Continuity fields for the social history ledgers, and the report that
 * `npm run social:continuity` prints before a creative brief.
 * The fields and series are defined in content/creative-direction.md.
 */

export interface ContinuityFields {
  series?: string
  episode?: number
  format?: string
  cast?: string[]
  stopper?: string
  callback?: string
  loudness?: number
  /** Benefit-page costume the piece wore (content/costumes.md), and the benefit page it points to. */
  costume?: string
  benefit?: string
}

type Draft = Record<string, unknown> | null | undefined

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

/**
 * Reads the continuity fields from a reviewed draft. Top-level fields win; `creativeBrief`
 * fills the gaps. Only fields that are present come back, so older drafts add nothing.
 */
export function continuityFields(draft: Draft): ContinuityFields {
  if (!draft || typeof draft !== 'object') return {}
  const brief = (draft.creativeBrief && typeof draft.creativeBrief === 'object' ? draft.creativeBrief : {}) as Record<string, unknown>
  const pick = (key: string) => (draft[key] !== undefined ? draft[key] : brief[key])

  const castRaw = pick('cast')
  const cast = Array.isArray(castRaw)
    ? castRaw.map(str).filter((c): c is string => !!c)
    : str(castRaw)
      ? [str(castRaw) as string]
      : str(draft.mascot) && draft.mascot !== 'none'
        ? [str(draft.mascot) as string]
        : undefined

  const fields: ContinuityFields = {
    series: str(pick('series')),
    episode: num(pick('episode')),
    format: str(pick('format')),
    cast: cast && cast.length ? cast : undefined,
    stopper: str(pick('stopper')),
    callback: str(pick('callback')),
    loudness: num(pick('loudness')),
    costume: str(pick('costume')),
    benefit: str(pick('benefit')),
  }
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as ContinuityFields
}

export interface LedgerEntry extends ContinuityFields {
  id?: string
  type?: string
  hookHeadline?: string
  topic?: string
  theme?: string
  mascot?: string
  scheduledFor?: string | null
  createdAt?: string
  status?: string
}

export interface ChannelEntry extends LedgerEntry {
  channel: 'post' | 'carousel' | 'reel'
  when: string
}

export interface ContinuityReport {
  recent: ChannelEntry[]
  seriesLatest: { series: string; episode: number | null; channel: string; when: string; hook?: string }[]
  castCounts: { character: string; count: number }[]
  repeatedHooks: { hook: string; count: number }[]
  /** Costumes worn in the recent pieces, most used first. */
  costumeCounts: { costume: string; count: number }[]
  /** Recent pieces that wore a costume. */
  costumed: number
  untracked: number
}

const normalizeHook = (hook: string) =>
  hook
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function toChannelEntries(posts: LedgerEntry[], reels: LedgerEntry[]): ChannelEntry[] {
  const all: ChannelEntry[] = [
    ...posts.map((p) => ({ ...p, channel: (p.type === 'carousel' ? 'carousel' : 'post') as ChannelEntry['channel'] })),
    ...reels.map((r) => ({ ...r, channel: 'reel' as const })),
  ].map((e) => ({ ...e, when: e.scheduledFor || e.createdAt || '' }))
  return all.sort((a, b) => b.when.localeCompare(a.when))
}

/** Builds the report from the two ledgers' entry arrays. `recentCount` bounds every section. */
export function summarizeContinuity(posts: LedgerEntry[], reels: LedgerEntry[], recentCount = 12): ContinuityReport {
  const entries = toChannelEntries(posts, reels)
  const recent = entries.slice(0, recentCount)

  const seriesLatest = new Map<string, ContinuityReport['seriesLatest'][number]>()
  for (const e of entries) {
    if (!e.series || seriesLatest.has(e.series)) continue
    seriesLatest.set(e.series, { series: e.series, episode: e.episode ?? null, channel: e.channel, when: e.when, hook: e.hookHeadline })
  }

  const cast = new Map<string, number>()
  for (const e of recent) {
    const people = e.cast?.length ? e.cast : e.mascot && e.mascot !== 'none' ? [e.mascot] : []
    for (const c of new Set(people)) cast.set(c, (cast.get(c) ?? 0) + 1)
  }

  const hooks = new Map<string, { hook: string; count: number }>()
  for (const e of entries.slice(0, recentCount * 3)) {
    if (!e.hookHeadline) continue
    const key = normalizeHook(e.hookHeadline)
    const seen = hooks.get(key)
    if (seen) seen.count += 1
    else hooks.set(key, { hook: e.hookHeadline, count: 1 })
  }

  const costumes = new Map<string, number>()
  for (const e of recent) if (e.costume) costumes.set(e.costume, (costumes.get(e.costume) ?? 0) + 1)

  return {
    recent,
    seriesLatest: [...seriesLatest.values()],
    castCounts: [...cast.entries()].map(([character, count]) => ({ character, count })).sort((a, b) => b.count - a.count),
    repeatedHooks: [...hooks.values()].filter((h) => h.count > 1).sort((a, b) => b.count - a.count),
    costumeCounts: [...costumes.entries()].map(([costume, count]) => ({ costume, count })).sort((a, b) => b.count - a.count),
    costumed: recent.filter((e) => e.costume).length,
    untracked: recent.filter((e) => !e.series).length,
  }
}

export function formatContinuityReport(report: ContinuityReport): string {
  const lines: string[] = []
  const day = (when: string) => (when ? when.slice(0, 10) : 'undated')

  lines.push(`Recent pieces (newest first, ${report.recent.length}):`)
  for (const e of report.recent) {
    const series = e.series ? `${e.series}${e.episode ? ` #${e.episode}` : ''}` : 'no series'
    const who = e.cast?.join(', ') || e.mascot || 'no cast'
    const costume = e.costume ? ` | costume ${e.costume}` : ''
    lines.push(`  ${day(e.when)}  ${e.channel.padEnd(8)} ${series} | ${e.format || 'format?'} | ${who}${costume} | ${e.hookHeadline || e.topic || ''}`)
  }

  lines.push('', 'Latest episode per series:')
  if (!report.seriesLatest.length) lines.push('  none yet: start each series at episode 1')
  for (const s of report.seriesLatest) {
    lines.push(`  ${s.series}: ${s.episode ?? '?'} (${s.channel}, ${day(s.when)})${s.hook ? `: ${s.hook}` : ''}`)
  }

  const crowd = Math.max(3, Math.ceil(report.recent.length / 4))
  lines.push('', `Cast in the last ${report.recent.length} pieces:`)
  for (const c of report.castCounts) {
    lines.push(`  ${c.character}: ${c.count}${c.count >= crowd ? '  <- overused, pick someone else unless the series needs them' : ''}`)
  }

  lines.push('', `Costumes in the last ${report.recent.length} pieces: ${report.costumed}${report.recent.length && report.costumed * 3 > report.recent.length ? '  <- over 1 in 3, make the next piece in the house look' : ''}`)
  for (const c of report.costumeCounts) lines.push(`  ${c.costume}: ${c.count}${c.count > 1 ? '  <- worn more than once, pick another costume next' : ''}`)

  if (report.repeatedHooks.length) {
    lines.push('', 'Hooks used more than once (do not reuse):')
    for (const h of report.repeatedHooks) lines.push(`  ${h.count}x  ${h.hook}`)
  }

  if (report.untracked) {
    lines.push('', `${report.untracked} recent pieces have no series recorded (made before the creative-direction playbook).`)
  }
  return lines.join('\n')
}
