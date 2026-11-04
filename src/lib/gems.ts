/**
 * Chitin Gems: the market currency members earn by showing up.
 *
 * Every award is a row in `gem_transactions` with a unique source key, so an award can
 * never land twice. `profiles.chitinGems` is a cached sum of that ledger.
 *
 * Tuning target: a regular member can buy a common piece every few days and a legendary
 * piece in a couple of months. Change the numbers here; nothing else needs editing.
 */

export const GEM_WELCOME_GRANT = 100

/** All daily liturgies checked off for one date. Taken back if a task is unchecked. */
export const GEM_ALL_TASKS_DAILY = 10

/** Streak milestones. Taken back with the day's tasks, like the XP bonus. */
export const GEM_STREAK_MILESTONES: { days: number; gems: number }[] = [
  { days: 3, gems: 25 },
  { days: 7, gems: 60 },
  { days: 14, gems: 120 },
  { days: 30, gems: 250 },
  { days: 60, gems: 400 },
  { days: 90, gems: 600 },
  { days: 180, gems: 1000 },
]

/** Reaching a stage. Awarded once per stage, kept even if XP later drops. */
export const GEM_STAGE_REWARDS: { stage: number; gems: number }[] = [
  { stage: 2, gems: 150 },
  { stage: 3, gems: 300 },
  { stage: 4, gems: 600 },
]

/** Each referral that earns its XP reward (the monthly cap applies). */
export const GEM_PER_REFERRAL = 100

export type GemFirstId = 'handle' | 'moltmax' | 'forum' | 'friend' | 'certificate'

/** One-time firsts. Checked from the database, so members who did them earlier still get them. */
export const GEM_FIRSTS: { id: GemFirstId; title: string; gems: number }[] = [
  { id: 'handle', title: 'Claim your name', gems: 25 },
  { id: 'moltmax', title: 'Finish the Moltmax quiz', gems: 50 },
  { id: 'forum', title: 'Post in the forum', gems: 50 },
  { id: 'friend', title: 'Make your first connection', gems: 50 },
  { id: 'certificate', title: 'Earn an Academy certificate', gems: 100 },
]

export type GemSource =
  | 'welcome'
  | 'all_tasks'
  | 'streak'
  | 'stage'
  | 'first'
  | 'referral'
  | 'simulation'
  | 'purchase'
  | 'refund'
  | 'admin'

export function gemStreakBonus(streakDays: number): number {
  return GEM_STREAK_MILESTONES.find((m) => m.days === streakDays)?.gems ?? 0
}

export interface GemHistoryEntry {
  id: string
  amount: number
  source: string
  description: string
  createdAt: string
}

export interface GemWallet {
  balance: number
  history: GemHistoryEntry[]
  firsts: { id: GemFirstId; title: string; gems: number; done: boolean }[]
}
