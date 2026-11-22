/**
 * The light list of benefit pages and costumes. No Vite-only APIs here, so scripts
 * (npm run benefits:check) can import it with tsx.
 */
import type { BenefitKit, BenefitSummary } from './types'

/** What each costume imitates. Shown on the hub and used by the skill. */
export const BENEFIT_KITS: Record<BenefitKit, { name: string; industry: string }> = {
  clinic: { name: 'Clinic', industry: 'Telehealth and biohacking' },
  can: { name: 'Can', industry: 'Energy drinks and snacks' },
  retreat: { name: 'Retreat', industry: 'Mindfulness retreats' },
}

/**
 * Every published benefit page, in hub order. Keep `blurb`, `indexed` and `updated` in step
 * with the page file; `npm run benefits:check` fails when they drift.
 */
export const BENEFIT_PAGES: BenefitSummary[] = [
  {
    slug: 'libido',
    topic: 'Libido',
    kit: 'clinic',
    blurb: 'A three minute assessment and a daily plan for getting your drive back.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'energy-drinks',
    topic: 'Energy drinks',
    kit: 'can',
    blurb: 'Zero sugar, zero caffeine, eight small things a day. Energy without the crash.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'spirituality',
    topic: 'Spirituality',
    kit: 'retreat',
    blurb: 'A daily practice for people who want something deeper than another app.',
    indexed: false,
    updated: '2026-11-22',
  },
]

export const BENEFITS_HUB_PATH = '/benefits'

export function benefitPath(slug: string) {
  return `${BENEFITS_HUB_PATH}/${slug}`
}

export function findBenefitSummary(slug: string): BenefitSummary | undefined {
  return BENEFIT_PAGES.find((page) => page.slug === slug)
}

export const INDEXED_BENEFIT_PAGES = BENEFIT_PAGES.filter((page) => page.indexed)

/** Sitemap rows for the approved benefit pages, plus the hub once any page is approved. */
export function benefitSitemapEntries(baseUrl = 'https://moltology.org') {
  if (INDEXED_BENEFIT_PAGES.length === 0) return []
  return [
    { loc: `${baseUrl}${BENEFITS_HUB_PATH}`, changefreq: 'monthly' as const, priority: 0.6 },
    ...INDEXED_BENEFIT_PAGES.map((page) => ({
      loc: `${baseUrl}${benefitPath(page.slug)}`,
      lastmod: page.updated,
      changefreq: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
