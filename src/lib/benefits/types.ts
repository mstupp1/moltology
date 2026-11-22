/**
 * Benefit landing pages: one page per "benefit" angle (Libido, Energy drinks, Spirituality...),
 * each dressed in the look of the industry that usually sells it. A page is data; its kit
 * (the industry costume) decides how it looks. See .agents/skills/benefit-landing-pages/SKILL.md.
 */
import type { FaqItem } from '@/lib/seo'

/** The industry costumes. Each has its own components and CSS in src/components/benefits/kits/. */
export type BenefitKit = 'clinic' | 'can' | 'retreat'

export interface BenefitImage {
  /** Site path under /images/benefits/<slug>/. */
  src: string
  alt: string
  width: number
  height: number
}

export interface BenefitLink {
  label: string
  href: string
}

/** The closing section, in the normal Moltology look, that every page sheds into. */
export interface BenefitReveal {
  headline: string
  body: string
  /** Which real app screenshot to show. */
  screenshot: 'dashboard' | 'oracle' | 'forum'
}

interface BenefitPageBase {
  slug: string
  /** The topic name from the master list, e.g. "Energy drinks". */
  topic: string
  /** The plain search phrase this page is built to rank for. */
  query: string
  /** <title>, 60 characters or fewer. */
  title: string
  /** Meta description, 120 to 160 characters. */
  description: string
  keywords: string
  /** false keeps the page out of search (noindex, not in the sitemap) until it is approved. */
  indexed: boolean
  /** Date the copy was last reviewed (YYYY-MM-DD). */
  updated: string
  /** The real Moltology feature or Codex passage this page is about. */
  hook: BenefitLink & { text: string }
  reveal: BenefitReveal
  faqs: FaqItem[]
  /** Slugs of other benefit pages to link to. */
  related: string[]
  /** One plain line for health or money topics. */
  disclaimer?: string
  shareImage?: BenefitImage
}

// ---------------------------------------------------------------------------
// Clinic: telehealth and biohacking
// ---------------------------------------------------------------------------

export interface ClinicContent {
  hero: {
    eyebrow: string
    headline: string
    sub: string
    checks: string[]
    cta: string
    image: BenefitImage
  }
  /** Small honest facts under the hero ("Free to join", "3 minute assessment"). */
  trust: string[]
  signs: { title: string; intro: string; items: string[] }
  steps: { title: string; items: { title: string; body: string }[] }
  plans: { title: string; intro: string; items: { name: string; tag: string; body: string; href: string }[] }
  compare: { title: string; us: string; them: string; rows: { label: string; us: string; them: string }[] }
}

// ---------------------------------------------------------------------------
// Can: CPG beverage
// ---------------------------------------------------------------------------

export interface CanContent {
  hero: {
    sticker: string
    headline: string
    sub: string
    cta: string
    image: BenefitImage
  }
  marquee: string[]
  flavors: { title: string; items: { name: string; note: string; tone: 'lime' | 'berry' | 'citrus' | 'ice' }[] }
  label: { title: string; serving: string; rows: { label: string; value: string }[]; footnote: string }
  crash: { title: string; without: string[]; with: string[] }
  story: { title: string; body: string[]; image: BenefitImage }
}

// ---------------------------------------------------------------------------
// Retreat: mindfulness and wellness retreats
// ---------------------------------------------------------------------------

export interface RetreatContent {
  hero: {
    kicker: string
    headline: string
    sub: string
    cta: string
    image: BenefitImage
  }
  intention: { quote: string; source: BenefitLink }
  rhythm: { title: string; intro: string; items: { time: string; title: string; body: string }[] }
  itinerary: { title: string; items: { day: string; title: string; body: string }[] }
  carry: { title: string; items: string[]; image: BenefitImage }
}

export type BenefitPage =
  | (BenefitPageBase & { kit: 'clinic'; content: ClinicContent })
  | (BenefitPageBase & { kit: 'can'; content: CanContent })
  | (BenefitPageBase & { kit: 'retreat'; content: RetreatContent })

/** The light listing used by the hub, the sitemap and related links. */
export interface BenefitSummary {
  slug: string
  topic: string
  kit: BenefitKit
  /** One line for cards and links. */
  blurb: string
  indexed: boolean
  updated: string
}
