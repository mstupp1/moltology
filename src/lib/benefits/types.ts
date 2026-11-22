/**
 * Benefit landing pages: one page per "benefit" angle (Libido, Energy drinks, Spirituality...),
 * each dressed in the look of the industry that usually sells it. A page is data; its kit
 * (the industry costume) decides how it looks. See .agents/skills/benefit-landing-pages/SKILL.md.
 */
import type { FaqItem } from '@/lib/seo'

/** The industry costumes. Each has its own components and CSS in src/components/benefits/kits/. */
export type BenefitKit =
  | 'clinic'
  | 'can'
  | 'retreat'
  | 'atelier'
  | 'ledger'
  | 'locker'
  | 'platform'
  | 'arcade'
  | 'seminar'
  | 'network'

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

// ---------------------------------------------------------------------------
// Atelier: fashion houses and editorial lookbooks
// ---------------------------------------------------------------------------

export interface AtelierContent {
  hero: { season: string; headline: string; sub: string; cta: string; image: BenefitImage }
  manifesto: string[]
  /** The eight daily tasks as numbered looks. */
  lookbook: { title: string; intro: string; items: { name: string; note: string }[] }
  campaign: { quote: string; credit: string; image: BenefitImage }
  care: { title: string; rows: { label: string; value: string }[]; footnote: string }
}

// ---------------------------------------------------------------------------
// Ledger: fintech and investing apps
// ---------------------------------------------------------------------------

export interface LedgerContent {
  hero: {
    eyebrow: string
    headline: string
    sub: string
    cta: string
    image: BenefitImage
    /** The app card over the hero image: a practice "balance" and its chart. */
    card: { label: string; value: string; change: string; points: number[] }
  }
  compound: { title: string; intro: string; rows: { label: string; value: string; note: string }[] }
  features: { title: string; items: { title: string; body: string }[] }
  statement: { title: string; intro: string; rows: { when: string; label: string; amount: string }[] }
}

// ---------------------------------------------------------------------------
// Locker room: sportswear and training brands
// ---------------------------------------------------------------------------

export interface LockerContent {
  hero: { tag: string; headline: string; sub: string; cta: string; image: BenefitImage }
  stats: { value: string; label: string }[]
  program: { title: string; intro: string; items: { set: string; title: string; body: string }[] }
  gear: { title: string; intro: string; items: string[]; image: BenefitImage }
  creed: string
}

// ---------------------------------------------------------------------------
// Platform: AI software launches
// ---------------------------------------------------------------------------

export interface PlatformContent {
  hero: { badge: string; headline: string; sub: string; cta: string; prompt: string; image: BenefitImage }
  features: { title: string; intro: string; items: { title: string; body: string }[] }
  workflow: { title: string; intro: string; steps: { when: string; then: string }[] }
  config: { title: string; body: string; filename: string; lines: string[] }
  plans: { title: string; items: { name: string; price: string; body: string; items: string[]; href?: string }[] }
}

// ---------------------------------------------------------------------------
// Arcade: video game launches
// ---------------------------------------------------------------------------

export interface ArcadeContent {
  hero: { tag: string; headline: string; sub: string; cta: string; image: BenefitImage }
  stats: { title: string; intro: string; items: { code: string; label: string; body: string; value: number }[] }
  quests: { title: string; intro: string; items: { title: string; body: string; reward: string }[] }
  modes: { title: string; items: { name: string; body: string }[]; image: BenefitImage }
  patch: { title: string; version: string; items: string[] }
}

// ---------------------------------------------------------------------------
// Seminar: self-help books and live events
// ---------------------------------------------------------------------------

export interface SeminarContent {
  hero: {
    kicker: string
    headline: string
    sub: string
    cta: string
    image: BenefitImage
    book: { title: string; subtitle: string; author: string }
  }
  promise: { title: string; items: string[] }
  chapters: { title: string; items: { title: string; body: string }[] }
  passage: { quote: string; source: BenefitLink }
  agenda: { title: string; intro: string; items: { time: string; title: string }[] }
}

// ---------------------------------------------------------------------------
// Network: social apps
// ---------------------------------------------------------------------------

export interface NetworkContent {
  hero: { headline: string; sub: string; cta: string; chips: string[]; image: BenefitImage }
  /** Sample posts in the hero phone, by the cast characters. */
  feed: { name: string; handle: string; text: string; tag: string }[]
  features: { title: string; items: { title: string; body: string }[] }
  rooms: { title: string; intro: string; items: { name: string; body: string }[] }
  norms: { title: string; items: string[] }
}

export type BenefitPage =
  | (BenefitPageBase & { kit: 'clinic'; content: ClinicContent })
  | (BenefitPageBase & { kit: 'can'; content: CanContent })
  | (BenefitPageBase & { kit: 'retreat'; content: RetreatContent })
  | (BenefitPageBase & { kit: 'atelier'; content: AtelierContent })
  | (BenefitPageBase & { kit: 'ledger'; content: LedgerContent })
  | (BenefitPageBase & { kit: 'locker'; content: LockerContent })
  | (BenefitPageBase & { kit: 'platform'; content: PlatformContent })
  | (BenefitPageBase & { kit: 'arcade'; content: ArcadeContent })
  | (BenefitPageBase & { kit: 'seminar'; content: SeminarContent })
  | (BenefitPageBase & { kit: 'network'; content: NetworkContent })

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
