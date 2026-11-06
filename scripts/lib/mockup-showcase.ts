/**
 * The staged "showcase member" for marketing captures.
 *
 * The synthetic preview session has no JWT, so every member-only read comes back empty or as an
 * authentication error, and the shots look like nobody uses the product. These fixtures answer
 * those reads in the browser instead, built from the same pure helpers the server uses, so the
 * shapes stay honest. Nothing here reaches the database or the network.
 */
import { toJSON } from 'seroval'
import type { BrowserContext, Route } from 'playwright-core'
import {
  CANONICAL_ALIGNMENT_TASKS,
  ALIGNMENT_HISTORY_DAYS,
  TOTAL_ALIGNMENT_TASKS,
  mergeCompletions,
} from '../../src/lib/alignment-tasks'
import { calculateProgression } from '../../src/lib/progression'
import {
  ALL_EQUIPMENT_CATALOG,
  STARTER_EQUIPMENT_CATALOG_IDS,
  catalogSeedInsertValues,
} from '../../src/lib/equipment-seed-data'
import { buildMarketPieces, type MarketPayload } from '../../src/lib/market'
import { GEM_FIRSTS } from '../../src/lib/gems'
import {
  VAULT_SIZE,
  computeLoadoutTotals,
  toCatalogRef,
  type ChassisLoadoutPayload,
  type EquipSlotId,
  type GearItemState,
} from '../../src/lib/chassis-loadout'
import { VECTOR_KEYS, resolveVectorBase } from '../../src/lib/vectors'
import { getStageLabel, type ConnectionMemberSummary, type ConnectionsListView } from '../../src/lib/connections'
import {
  buildConnectionAcceptedCopy,
  buildDayAlignedCopy,
  buildRoutineCompletedCopy,
  buildStageReachedCopy,
  buildStreakMilestoneCopy,
  toActivityEventView,
  type ActivityFeedPage,
} from '../../src/lib/activity-events'

/** The preview session's member id (see resolveAuthSession). */
export const SHOWCASE_USER_ID = '00000000-0000-0000-0000-000000000001'

/** Captures pin the clock to this local time on the capture day, so "Next" lands on a morning task. */
export const SHOWCASE_CLOCK = { hour: 9, minute: 40 }

/** A member mid Stage 2: a few weeks of steady practice, three tasks done this morning. */
const SHOWCASE_XP = 6_400
const SHOWCASE_STAGE = 2
const STREAK_DAYS = 23
const DONE_TODAY = 3

export function showcaseNow(day = new Date()): Date {
  const now = new Date(day)
  now.setHours(SHOWCASE_CLOCK.hour, SHOWCASE_CLOCK.minute, 0, 0)
  return now
}

function localDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Deterministic 0..1 noise, so the heatmap looks the same on every run. */
function noise(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function showcaseAlignment(now: Date) {
  const date = localDate(now)
  const completedKeys = CANONICAL_ALIGNMENT_TASKS.slice(0, DONE_TODAY).map((task) => task.key)
  const history: Array<{ date: string; completedCount: number }> = []
  for (let i = ALIGNMENT_HISTORY_DAYS - 1; i >= 0; i--) {
    const day = localDate(shiftDays(now, -i))
    let count: number
    if (i === 0) count = DONE_TODAY
    else if (i <= STREAK_DAYS) count = noise(i) > 0.35 ? TOTAL_ALIGNMENT_TASKS : 5 + Math.floor(noise(i + 99) * 3)
    else if (i === STREAK_DAYS + 1) count = 0
    else count = noise(i) > 0.3 ? 2 + Math.floor(noise(i + 7) * 6) : 0
    history.push({ date: day, completedCount: count })
  }
  return {
    date,
    tasks: mergeCompletions(completedKeys),
    completedKeys,
    completedCount: completedKeys.length,
    totalCount: TOTAL_ALIGNMENT_TASKS,
    isAllCompleted: false,
    history,
    streakDays: STREAK_DAYS,
    xp: SHOWCASE_XP,
    stage: SHOWCASE_STAGE,
    progression: calculateProgression(SHOWCASE_XP, SHOWCASE_STAGE),
  }
}

/** Past Oracle chats in the sidebar. Titles read like what a member would actually ask. */
export function showcaseThreads(now: Date) {
  const titles = [
    'Report due Friday, keep opening my inbox',
    'Morning routine that survives meetings',
    'Phone out of the bedroom for a week',
    'Breaking a big refactor into sheds',
    'Why I stall after lunch',
    'Planning a quieter weekend',
  ]
  return titles.map((title, index) => {
    const updatedAt = new Date(now.getTime() - (index === 0 ? 4 : index * 26) * 60 * 60 * 1000)
    return {
      id: `5a0e0000-0000-4000-8000-00000000000${index + 1}`,
      userId: SHOWCASE_USER_ID,
      title,
      persona: 'oracle',
      pinnedAt: null,
      archivedAt: null,
      createdAt: updatedAt,
      updatedAt,
    }
  })
}

const GEAR_ROWS = ALL_EQUIPMENT_CATALOG.map(catalogSeedInsertValues)

/** Pieces the showcase member has bought on top of the starter set. */
const SHOWCASE_UNLOCKS = [
  'a1000000-0000-4000-8000-000000000002', // Tide-Braced Carapace
  'a1000000-0000-4000-8000-000000000005', // Hydraulic Crush Claws
  'a1000000-0000-4000-8000-00000000000e', // Depth-Sense Antennae
  'a1000000-0000-4000-8000-000000000016', // Silt-Tension Vent Sash
  'a1000000-0000-4000-8000-00000000000b', // Current-Cutter Legs
]

const SHOWCASE_EQUIPPED: Partial<Record<EquipSlotId, string>> = {
  head: 'a2000000-0000-4000-8000-000000000003', // Headset
  carapace: 'a1000000-0000-4000-8000-000000000002',
  'claws-1': 'a1000000-0000-4000-8000-000000000005',
  'claws-2': 'a1000000-0000-4000-8000-000000000005',
  antennae: 'a1000000-0000-4000-8000-00000000000e',
  legs: 'a1000000-0000-4000-8000-00000000000b',
  belt: 'a1000000-0000-4000-8000-000000000016',
}

const SHOWCASE_SCORES = [64, 58, 71, 66, 55]

const SHOWCASE_AVATAR = {
  style: 'critters',
  seed: 'showcase-coral',
  race: 'lobster',
  mouth: 'smile',
  eyeColor: 'amber',
  gaze: 'ahead',
}

export function showcaseMarket(): MarketPayload {
  const owned = new Set([...STARTER_EQUIPMENT_CATALOG_IDS, ...SHOWCASE_UNLOCKS])
  return {
    wallet: {
      balance: 340,
      history: [],
      firsts: GEM_FIRSTS.map((first) => ({ ...first, done: first.id !== 'certificate' })),
    },
    everyItem: false,
    moltCredits: 0,
    creditsLive: false,
    pieces: buildMarketPieces(GEAR_ROWS.filter((row) => row.kind === 'gear'), owned, false),
  }
}

export function showcaseChassis(): ChassisLoadoutPayload {
  const owned = new Set([...STARTER_EQUIPMENT_CATALOG_IDS, ...SHOWCASE_UNLOCKS])
  const catalog = GEAR_ROWS.filter((row) => row.kind !== 'cosmetic' && owned.has(row.id)).map(toCatalogRef)
  const items: GearItemState[] = Object.entries(SHOWCASE_EQUIPPED).map(([slot, catalogItemId], index) => ({
    id: `5a0e1000-0000-4000-8000-00000000000${index + 1}`,
    catalogItemId: catalogItemId!,
    equippedSlot: slot as EquipSlotId,
    vaultIndex: null,
    lookSlot: null,
  }))
  const scores = Object.fromEntries(VECTOR_KEYS.map((key, i) => [key, SHOWCASE_SCORES[i] ?? 60]))
  return {
    catalog,
    items,
    totals: computeLoadoutTotals(items, new Map(catalog.map((c) => [c.id, c]))),
    vaultSize: VAULT_SIZE,
    config: SHOWCASE_AVATAR as ChassisLoadoutPayload['config'],
    appearanceRevision: 1,
    allUnlocked: true,
    vectorBase: resolveVectorBase({ moltmaxDimensionScores: scores, moltmaxCompletedAt: '2026-09-02T10:00:00Z' }, SHOWCASE_USER_ID),
  }
}

/** The showcase member's circle. Plain handles, the way members actually name themselves. */
const CIRCLE = [
  { id: '5a0e2000-0000-4000-8000-000000000001', handle: 'tidewalker', larvaId: '2207', stage: 3 },
  { id: '5a0e2000-0000-4000-8000-000000000002', handle: 'kelp_and_quiet', larvaId: '3141', stage: 2 },
  { id: '5a0e2000-0000-4000-8000-000000000003', handle: 'saltmarsh', larvaId: '4610', stage: 2 },
  { id: '5a0e2000-0000-4000-8000-000000000004', handle: 'deepnote', larvaId: '5872', stage: 1 },
]

export function showcaseConnections(now: Date): ConnectionsListView {
  const friends: ConnectionMemberSummary[] = CIRCLE.map((member, index) => ({
    id: member.id,
    larvaId: member.larvaId,
    handle: member.handle,
    displayName: member.handle,
    stage: member.stage,
    stageLabel: getStageLabel(member.stage),
    avatarConfig: { style: 'critters', seed: `showcase-${member.handle}` },
    since: shiftDays(now, -(12 + index * 9)).toISOString(),
  }))
  return { friends, incoming: [], outgoing: [] }
}

export function showcaseActivity(now: Date): ActivityFeedPage {
  const [tide, kelp, salt, deep] = CIRCLE
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000)
  const rows = [
    { actor: kelp, at: minutesAgo(18), kind: 'routine_completed', ...buildRoutineCompletedCopy(CANONICAL_ALIGNMENT_TASKS[0]) },
    { actor: tide, at: minutesAgo(52), kind: 'streak_milestone', ...buildStreakMilestoneCopy(30) },
    { actor: salt, at: minutesAgo(60 * 9), kind: 'day_aligned', ...buildDayAlignedCopy(TOTAL_ALIGNMENT_TASKS, TOTAL_ALIGNMENT_TASKS) },
    { actor: kelp, at: minutesAgo(60 * 20), kind: 'stage_reached', ...buildStageReachedCopy(2) },
    { actor: deep, at: minutesAgo(60 * 30), kind: 'connection_accepted', ...buildConnectionAcceptedCopy('saltmarsh') },
  ]
  return {
    events: rows.map((row, index) => toActivityEventView({
      id: `5a0e3000-0000-4000-8000-00000000000${index + 1}`,
      userId: row.actor.id,
      kind: row.kind,
      title: row.title,
      detail: row.detail,
      valueBadge: row.valueBadge,
      visibility: 'friends',
      href: null,
      metadata: {},
      createdAt: row.at,
      actorHandle: row.actor.handle,
      actorLarvaId: row.actor.larvaId,
      actorStage: row.actor.stage,
      actorAvatarConfig: { style: 'critters', seed: `showcase-${row.actor.handle}` },
    }, now, SHOWCASE_USER_ID)),
    nextCursor: null,
  }
}

/** Server function export name (as TanStack Start encodes it in the URL) to its staged reply. */
export function showcaseFixtures(now: Date): Record<string, unknown> {
  return {
    getDailyAlignmentFn: showcaseAlignment(now),
    getAIThreadsFn: showcaseThreads(now),
    getMarketFn: showcaseMarket(),
    getChassisLoadoutFn: showcaseChassis(),
    listConnectionsFn: showcaseConnections(now),
    getActivityFeedFn: showcaseActivity(now),
  }
}

/** Decodes `/_serverFn/<base64url {"file","export"}>` to the bare export name. */
export function serverFnExportName(url: string): string | null {
  const encoded = new URL(url).pathname.split('/_serverFn/')[1]?.split('/')[0]
  if (!encoded) return null
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { export?: string }
    return decoded.export?.replace(/_createServerFn_handler$/, '') ?? null
  } catch {
    return null
  }
}

/** TanStack Start's serialized server function reply body. */
export function serverFnBody(result: unknown): string {
  return JSON.stringify(toJSON({ result, error: undefined, context: {} }).t)
}

/**
 * Stages the showcase member in one capture context: the clock, a placeholder token (so member
 * hooks run their fetches), and the fixture replies. Reads not listed pass through to the server.
 */
export async function installShowcase(context: BrowserContext, now: Date) {
  const fixtures = showcaseFixtures(now)
  // A JWT-shaped placeholder; the server rejects it, so unlisted member reads stay empty.
  await context.route('**/api/auth/token', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'capture.showcase.member' }) }))
  await context.route('**/_serverFn/**', async (route: Route) => {
    const name = serverFnExportName(route.request().url())
    if (!name || !(name in fixtures)) return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'x-tss-serialized': 'true' },
      body: serverFnBody(fixtures[name]),
    })
  })
  const snapshot = { date: localDate(now), completedKeys: (fixtures.getDailyAlignmentFn as { completedKeys: string[] }).completedKeys }
  await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    `moltology:alignment:snapshot:${SHOWCASE_USER_ID}`,
    JSON.stringify(snapshot),
  ] as const)
}
