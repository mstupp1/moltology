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
  atelier: { name: 'Atelier', industry: 'Fashion houses and lookbooks' },
  ledger: { name: 'Ledger', industry: 'Fintech and investing apps' },
  locker: { name: 'Locker room', industry: 'Sportswear and training' },
  platform: { name: 'Platform', industry: 'AI software launches' },
  arcade: { name: 'Arcade', industry: 'Video game launches' },
  seminar: { name: 'Seminar', industry: 'Self-help books and events' },
  network: { name: 'Network', industry: 'Social apps' },
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
  {
    slug: 'fashion',
    topic: 'Fashion',
    kit: 'atelier',
    blurb: 'Personal style that starts before the closet: posture, calm and attention.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'investing',
    topic: 'Investing',
    kit: 'ledger',
    blurb: 'Small daily deposits of focus and learning that compound for years.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'strength',
    topic: 'Strength',
    kit: 'locker',
    blurb: 'Mental toughness trained like a lift: eight small reps a day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'automation',
    topic: 'Automation',
    kit: 'platform',
    blurb: 'Put your daily routine on rails and keep your attention for the work.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'gaming',
    topic: 'Gaming',
    kit: 'arcade',
    blurb: 'Daily quests, XP, a weekly board and a character that grows with you.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'charisma',
    topic: 'Charisma',
    kit: 'seminar',
    blurb: 'The quiet habits behind presence, practiced every day for free.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'community',
    topic: 'Community',
    kit: 'network',
    blurb: 'A friendly self improvement community with no feed to scroll.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'hardness',
    topic: 'Hardness',
    kit: 'clinic',
    blurb: 'A short assessment and a daily plan for a thicker skin.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'focus',
    topic: 'Focus',
    kit: 'clinic',
    blurb: 'One block of deep work a day, set up so the phone loses.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'clarity',
    topic: 'Clarity',
    kit: 'clinic',
    blurb: 'Quiet mornings and fewer inputs for a head that feels foggy.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'intelligence',
    topic: 'Intelligence',
    kit: 'clinic',
    blurb: 'Learn one hard thing a day and keep a record of it.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'energy',
    topic: 'Energy',
    kit: 'can',
    blurb: 'A day built so the afternoon does not fall off a cliff.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'spice',
    topic: 'Spice',
    kit: 'can',
    blurb: 'Eight small daily dares for a life stuck on mild.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'zest',
    topic: 'Zest',
    kit: 'can',
    blurb: 'A bright, small daily routine for when everything tastes flat.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'faith',
    topic: 'Faith',
    kit: 'retreat',
    blurb: 'Something to practice when you want faith without a creed.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'freedom',
    topic: 'Freedom',
    kit: 'retreat',
    blurb: 'Let one thing go every night and feel lighter for it.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'emotional',
    topic: 'Emotional',
    kit: 'retreat',
    blurb: 'Steady habits for strong feelings: a pause, a reset, a release.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'empathy',
    topic: 'Empathy',
    kit: 'retreat',
    blurb: 'Help one person a day and practice listening on purpose.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'beauty',
    topic: 'Beauty',
    kit: 'atelier',
    blurb: 'Inner beauty, dressed up: calm, care and a character to style.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'sexy',
    topic: 'Sexy',
    kit: 'atelier',
    blurb: 'Attraction starts with how you carry yourself. Train that daily.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'famous',
    topic: 'Famous',
    kit: 'atelier',
    blurb: 'Standing out by being consistent where people can see it.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'stature',
    topic: 'Stature',
    kit: 'atelier',
    blurb: 'Presence is built in quiet daily habits, not inches.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'financial',
    topic: 'Financial',
    kit: 'ledger',
    blurb: 'Discipline with money starts as discipline with your day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'generational',
    topic: 'Generational',
    kit: 'ledger',
    blurb: 'Break the patterns you inherited, one small entry a day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'career',
    topic: 'Career',
    kit: 'ledger',
    blurb: 'Career growth from one deep work block and one hard lesson a day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'hustle',
    topic: 'Hustle',
    kit: 'ledger',
    blurb: 'Work hard, stop on time, and come back tomorrow.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'physicality',
    topic: 'Physicality',
    kit: 'locker',
    blurb: 'Train the link between a calm mind and a body you notice.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'grip',
    topic: 'Grip',
    kit: 'locker',
    blurb: 'Get a grip on your day: one thing first, every morning.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'fitness',
    topic: 'Fitness',
    kit: 'locker',
    blurb: 'Mental fitness with stats, reps and a weekly board.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'movement',
    topic: 'Movement',
    kit: 'locker',
    blurb: 'Small daily movement against the habit of stalling.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'resilience',
    topic: 'Resilience',
    kit: 'locker',
    blurb: 'Practice bouncing back while the stakes are small.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'synergy',
    topic: 'Synergy',
    kit: 'platform',
    blurb: 'Eight habits stacked into one daily system.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'ai-swarms',
    topic: 'AI swarms',
    kit: 'platform',
    blurb: 'An AI guide, a forum full of people and a daily plan.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'cyber',
    topic: 'Cyber',
    kit: 'platform',
    blurb: 'Screen time rules you set in advance, then keep.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'adaptive',
    topic: 'Adaptive',
    kit: 'platform',
    blurb: 'Practice dropping old routines before they stop fitting.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'gamification',
    topic: 'Gamification',
    kit: 'arcade',
    blurb: 'A habit app with XP, streaks, stages and a weekly board.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'technique',
    topic: 'Technique',
    kit: 'arcade',
    blurb: 'Focus rounds, deep work and a set-up ritual, scored daily.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'self-help-books',
    topic: 'Self help Books',
    kit: 'seminar',
    blurb: 'The book you keep meaning to finish, turned into daily practice.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'communication',
    topic: 'Communication',
    kit: 'seminar',
    blurb: 'Talk less, listen more, and help one person a day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'commitment',
    topic: 'Commitment',
    kit: 'seminar',
    blurb: 'Hold one objective and keep showing up for it.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'loyalty',
    topic: 'Loyalty',
    kit: 'seminar',
    blurb: 'Loyalty as a daily habit: show up for your people.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'answers',
    topic: 'Answers',
    kit: 'seminar',
    blurb: 'Big questions, small daily practice, no promises of answers.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'truth',
    topic: 'Truth',
    kit: 'seminar',
    blurb: 'A nightly audit for being honest with yourself.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'social',
    topic: 'Social',
    kit: 'network',
    blurb: 'Make friends as an adult by showing up somewhere every day.',
    indexed: false,
    updated: '2026-11-22',
  },
  {
    slug: 'culture',
    topic: 'Culture',
    kit: 'network',
    blurb: 'A small internet culture built around getting better.',
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

/**
 * Every page keeps its hero at this bucket key; the gallery uses it as the thumbnail.
 * `?v=` busts CDN entries cached before an image was uploaded (bump it when replacing images).
 */
export function benefitHeroSrc(slug: string) {
  return `/images/benefits/${slug}/hero.jpg?v=2`
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
