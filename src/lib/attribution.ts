/**
 * First-touch campaign attribution from utm_* links (YouTube descriptions,
 * pinned comments, social bios). The first tagged visit is kept in the browser
 * for 30 days and sent along with lead captures, so a Field Manual download can
 * be traced back to the video that sent it.
 */

import { SITE_ORIGIN } from './seo'

export const ATTRIBUTION_STORAGE_KEY = 'moltology:attribution'
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const UTM_KEYS = ['source', 'medium', 'campaign', 'content'] as const
type UtmKey = (typeof UTM_KEYS)[number]

export type Attribution = Partial<Record<UtmKey, string>> & {
  /** Path the visitor landed on. */
  landing?: string
  /** Epoch ms of the tagged visit. */
  at?: number
}

function clean(value: string | null): string | undefined {
  const v = value?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 80)
  return v || undefined
}

/** Reads utm_source/medium/campaign/content from a query string. Null without a source. */
export function parseAttribution(search: string, landing?: string, at?: number): Attribution | null {
  const params = new URLSearchParams(search)
  const out: Attribution = {}
  for (const key of UTM_KEYS) {
    const v = clean(params.get(`utm_${key}`))
    if (v) out[key] = v
  }
  if (!out.source) return null
  if (landing) out.landing = landing.slice(0, 120)
  if (at !== undefined) out.at = at
  return out
}

/** Compact query-string form stored alongside a lead, e.g. `utm_source=youtube&utm_campaign=why-youre-stuck`. */
export function formatAttribution(a: Attribution | null): string {
  if (!a) return ''
  const params = new URLSearchParams()
  for (const key of UTM_KEYS) if (a[key]) params.set(`utm_${key}`, a[key]!)
  return params.toString()
}

/** Lead referrer: the page the form sat on, plus the first-touch campaign when there is one. */
export function leadReferrer(pathname: string, a: Attribution | null): string {
  const utm = formatAttribution(a)
  return (utm ? `${pathname}?${utm}` : pathname).slice(0, 300)
}

/** True when a stored attribution is still within its window. */
export function isFresh(a: Attribution | null, now: number): a is Attribution {
  return Boolean(a?.source && typeof a.at === 'number' && now - a.at < ATTRIBUTION_TTL_MS)
}

/**
 * Tagged link for a YouTube description or pinned comment.
 * `youtubeLink('/guide', 'why-youre-stuck')` → https://moltology.org/guide?utm_source=youtube&utm_medium=video&utm_campaign=why-youre-stuck
 */
export function youtubeLink(path: string, videoSlug: string, placement: 'description' | 'pinned' | 'card' = 'description'): string {
  const url = new URL(path, SITE_ORIGIN)
  url.searchParams.set('utm_source', 'youtube')
  url.searchParams.set('utm_medium', 'video')
  url.searchParams.set('utm_campaign', clean(videoSlug) ?? 'unknown')
  url.searchParams.set('utm_content', placement)
  return url.toString()
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Stored first-touch attribution, or null when missing, expired or unreadable. */
export function readAttribution(now = Date.now()): Attribution | null {
  try {
    const raw = storage()?.getItem(ATTRIBUTION_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Attribution) : null
    return isFresh(parsed, now) ? parsed : null
  } catch {
    return null
  }
}

/** Call once per page load in the browser. Keeps the first tagged visit; later tags don't overwrite it. */
export function captureAttribution(now = Date.now()): void {
  if (typeof window === 'undefined') return
  try {
    if (readAttribution(now)) return
    const found = parseAttribution(window.location.search, window.location.pathname, now)
    if (found) storage()?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(found))
  } catch {
    // Storage blocked (private mode, disabled site data). Attribution is best-effort.
  }
}

/** Referrer value for lead forms, safe to call during event handlers only. */
export function currentLeadReferrer(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return leadReferrer(window.location.pathname, readAttribution() ?? parseAttribution(window.location.search))
}
