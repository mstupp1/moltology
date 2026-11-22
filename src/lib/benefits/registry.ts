import type { BenefitPage } from './types'
import { findBenefitSummary } from './summaries'

export * from './summaries'

const pageModules = import.meta.glob<{ default: BenefitPage }>('./pages/*.ts')

/** Loads one page's full content. Each page is its own chunk, so the route stays small. */
export async function loadBenefitPage(slug: string): Promise<BenefitPage | null> {
  if (!findBenefitSummary(slug)) return null
  const load = pageModules[`./pages/${slug}.ts`]
  if (!load) return null
  const mod = await load()
  return mod.default
}
