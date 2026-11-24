/**
 * The arcade: short games that star the player's own 3D character.
 *
 * Pure rules live here (the game list, rewards, the score sanity check); reads and writes live in
 * server/arcade.ts. Change reward numbers here; nothing else needs editing.
 */

export const ARCADE_GAME_IDS = ['riptide', 'current-runner'] as const
export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number]

export interface ArcadeGame {
  id: ArcadeGameId
  title: string
  /** One line for the arcade card. */
  tagline: string
  /** How to play, in a sentence. */
  howTo: string
  path: `/arcade/${ArcadeGameId}`
  /**
   * The fewest seconds between two points, at the game's top speed. The server refuses a score
   * that would need points faster than this.
   */
  minSecondsPerPoint: number
  /** Seconds before the first point can land. */
  leadInSeconds: number
  maxScore: number
  /** A run must reach this score to earn XP or place for weekly gems. */
  minRewardScore: number
  /** What a point is called on the results card ("metres"), if not just a score. */
  unit?: string
}

export const ARCADE_GAMES: Record<ArcadeGameId, ArcadeGame> = {
  riptide: {
    id: 'riptide',
    title: 'Riptide',
    tagline: 'Swim the reef current and slip through the gaps.',
    howTo: 'Tap, click or press space to kick upward. Thread the gaps between rocks, reef and old pipes. Touch anything and the run ends.',
    path: '/arcade/riptide',
    // Gaps sit 4.4 units apart and the current tops out at 5.2 units a second (riptide-sim.ts).
    minSecondsPerPoint: 0.8,
    leadInSeconds: 1.5,
    maxScore: 9999,
    minRewardScore: 3,
  },
  'current-runner': {
    id: 'current-runner',
    title: 'Current Runner',
    tagline: 'Run the seafloor as the current picks up speed.',
    howTo: 'Tap, click or press space to jump urchins and coral; hold it to jump higher. Swipe down or press the down arrow to duck under jellyfish. The current keeps getting faster.',
    path: '/arcade/current-runner',
    // A point is a metre; the current tops out at 13 metres a second (current-runner-sim.ts).
    minSecondsPerPoint: 0.075,
    leadInSeconds: 0,
    maxScore: 99999,
    // About 15 seconds of running.
    minRewardScore: 100,
    unit: 'm',
  },
}

export function isArcadeGameId(value: unknown): value is ArcadeGameId {
  return typeof value === 'string' && (ARCADE_GAME_IDS as readonly string[]).includes(value)
}

/* ── Rewards ─────────────────────────────────────────────── */

/** XP for a finished run that scores at least its game's minRewardScore. */
export const ARCADE_XP_PER_RUN = 5
/** Rewarded runs per member per UTC day, across all games (so 20 XP a day at most). */
export const ARCADE_XP_RUNS_PER_DAY = 4
/**
 * Gems for each game's weekly top 10, paid once the week (Monday 00:00 UTC) is over. Arcade XP is
 * left out of the weekly XP leaderboard so play cannot swamp it.
 */
export const ARCADE_WEEKLY_GEMS: readonly number[] = [100, 75, 50, 25, 25, 25, 25, 25, 25, 25]

export function arcadeWeeklyGems(rank: number): number {
  return ARCADE_WEEKLY_GEMS[rank - 1] ?? 0
}

/** Runs a member may start in an hour before new runs stop being recorded. */
export const ARCADE_RUNS_PER_HOUR = 120
/** A run left open longer than this is too old to finish. */
export const ARCADE_RUN_MAX_MS = 60 * 60 * 1000

/** Rows on a game's leaderboard. */
export const ARCADE_BOARD_SIZE = 10

export type ArcadeBoardWindow = 'week' | 'all'

/**
 * The highest score a run could honestly reach in `elapsedMs` (measured by the server from start
 * to finish, so network time only makes it more generous).
 */
export function arcadeScoreCeiling(game: ArcadeGame, elapsedMs: number): number {
  const seconds = Math.max(0, elapsedMs / 1000 - game.leadInSeconds)
  return Math.min(game.maxScore, Math.floor(seconds / game.minSecondsPerPoint) + 1)
}

/** Whether a submitted score is believable for the time the run took. */
export function isPlausibleScore(game: ArcadeGame, score: number, elapsedMs: number): boolean {
  if (!Number.isInteger(score) || score < 0) return false
  return score <= arcadeScoreCeiling(game, elapsedMs)
}

/** Whether a run earns XP: high enough score and under the daily cap. */
export function arcadeRunEarnsXp(game: ArcadeGame, score: number, rewardedToday: number): boolean {
  return score >= game.minRewardScore && rewardedToday < ARCADE_XP_RUNS_PER_DAY
}

/** YYYY-MM-DD in UTC, the day the XP cap counts. */
export function arcadeDay(at: Date): string {
  return at.toISOString().slice(0, 10)
}
