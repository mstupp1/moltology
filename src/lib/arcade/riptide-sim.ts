/**
 * Riptide's rules, free of any drawing: the swimmer, the current and the columns of rock, reef and
 * old pipe it threads. The renderer (riptide-scene.ts) reads this state each frame; tests drive it
 * directly.
 *
 * World units: the play field is 9 wide and 12 tall (a fixed 3:4 window on every screen so no
 * one sees further ahead), x runs left to right with the swimmer fixed at PLAYER_X, y runs up
 * from the seabed.
 */

export const FIELD_W = 9
export const FIELD_H = 12
/** Top of the sand. Touching it ends the run. */
export const FLOOR_Y = 1
/** The surface. The swimmer bumps against it rather than dying. */
export const CEIL_Y = FIELD_H
export const PLAYER_X = -2
/** Hit radius of the swimmer, a little smaller than the drawn character so grazes feel fair. */
export const PLAYER_R = 0.42
export const START_Y = 6.4

export const GRAVITY = 24
export const KICK_SPEED = 7.6
export const MAX_FALL = 11
export const MAX_RISE = 9

export const SPEED_START = 3.4
export const SPEED_STEP = 0.05
export const SPEED_MAX = 5.2

/** Distance between one column pair and the next. */
export const SPACING = 4.4
/** Drawn width of a column; the hit width is a little narrower. */
export const COLUMN_W = 1.3
export const COLUMN_HIT_W = 1.1
export const FIRST_COLUMN_X = 6
export const GAP_START = 3.6
export const GAP_MIN = 2.9
export const GAP_STEP = 0.02
/** Largest jump in gap height from one pair to the next, so every gap can be reached. */
export const GAP_SHIFT_MAX = 3.2
/**
 * Late in a run the gaps start to drift up and down, so long runs stay tense once the speed and gap
 * have bottomed out. From DRIFT_FROM points the swing grows to DRIFT_MAX (up and down from the
 * middle). The jump between neighbours shrinks by the same amount, so the furthest any gap can be
 * from the last never exceeds GAP_SHIFT_MAX.
 */
export const DRIFT_FROM = 40
export const DRIFT_STEP = 0.03
export const DRIFT_MAX = 0.9
/** Radians a second: a full swing every ~4.5 s, about 1.3 units a second at the widest. */
export const DRIFT_RATE = 1.4

export type ColumnKind = 'rock' | 'reef' | 'pipe'

export interface Column {
  id: number
  x: number
  /** Middle of the gap now (moves on a drifting column). */
  gapY: number
  /** Middle of its swing, how far it swings each way, and where in the swing it started. */
  baseY: number
  drift: number
  phase: number
  gap: number
  kind: ColumnKind
  /** A per-column number for the renderer's shapes and colours. */
  variant: number
  passed: boolean
}

export type Phase = 'ready' | 'playing' | 'dead'

export interface RiptideState {
  phase: Phase
  /** Seconds since the run started (the first kick). */
  time: number
  y: number
  vy: number
  score: number
  speed: number
  columns: Column[]
  /** Distance swum since the start, for the seabed and background to scroll by. */
  distance: number
  /** Where the next column appears, in distance swum. */
  nextAt: number
  nextId: number
  lastGapY: number
  lastDrift: number
  rng: () => number
}

export interface StepEvents {
  kicked: boolean
  scored: boolean
  died: boolean
}

/** Small seeded generator (mulberry32), so a run's columns follow from its seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRiptide(seed: number): RiptideState {
  return {
    phase: 'ready',
    time: 0,
    y: START_Y,
    vy: 0,
    score: 0,
    speed: SPEED_START,
    columns: [],
    distance: 0,
    nextAt: 0,
    nextId: 1,
    lastGapY: START_Y,
    lastDrift: 0,
    rng: seededRandom(seed),
  }
}

export function gapFor(score: number): number {
  return Math.max(GAP_MIN, GAP_START - score * GAP_STEP)
}

export function driftFor(score: number): number {
  return score < DRIFT_FROM ? 0 : Math.min(DRIFT_MAX, (score - DRIFT_FROM + 1) * DRIFT_STEP)
}

export function speedFor(score: number): number {
  return Math.min(SPEED_MAX, SPEED_START + score * SPEED_STEP)
}

function spawn(state: RiptideState, x: number): Column {
  const gap = gapFor(state.score)
  const drift = driftFor(state.score)
  const low = FLOOR_Y + gap / 2 + 1 + drift
  const high = CEIL_Y - gap / 2 - 0.8 - drift
  const shift = GAP_SHIFT_MAX - drift - state.lastDrift
  const from = Math.max(low, state.lastGapY - shift)
  const to = Math.min(high, state.lastGapY + shift)
  const baseY = from + state.rng() * Math.max(0, to - from)
  const roll = state.rng()
  const kind: ColumnKind = roll < 0.45 ? 'rock' : roll < 0.75 ? 'reef' : 'pipe'
  const variant = state.rng()
  const phase = drift > 0 ? state.rng() * Math.PI * 2 : 0
  const column: Column = { id: state.nextId++, x, gapY: baseY, baseY, drift, phase, gap, kind, variant, passed: false }
  column.gapY = gapAt(column, state.time)
  state.lastGapY = baseY
  state.lastDrift = drift
  return column
}

/** Where a column's gap is at this point in the run. */
export function gapAt(column: Column, time: number): number {
  return column.drift ? column.baseY + column.drift * Math.sin(time * DRIFT_RATE + column.phase) : column.baseY
}

/** Whether a circle at (PLAYER_X, y) touches either half of a column. */
export function hitsColumn(column: Column, y: number, r = PLAYER_R): boolean {
  const half = COLUMN_HIT_W / 2
  const dx = Math.max(0, Math.abs(PLAYER_X - column.x) - half)
  if (dx >= r) return false
  const top = column.gapY + column.gap / 2
  const bottom = column.gapY - column.gap / 2
  // Distance from the circle's centre to each half (a box running off the field).
  const dyTop = Math.max(0, top - y)
  const dyBottom = Math.max(0, y - bottom)
  return dx * dx + dyTop * dyTop < r * r || dx * dx + dyBottom * dyBottom < r * r
}

/**
 * Move the game on by `dt` seconds. `kick` is a tap since the last step. Steps should be small
 * (the game runs fixed 1/120 s steps); large ones are split.
 */
export function stepRiptide(state: RiptideState, dt: number, kick: boolean): StepEvents {
  const events: StepEvents = { kicked: false, scored: false, died: false }
  if (state.phase === 'ready') {
    if (!kick) return events
    state.phase = 'playing'
  }

  if (state.phase === 'playing' && kick) {
    state.vy = KICK_SPEED
    events.kicked = true
  }

  // The swimmer falls on after a crash until it rests on the sand.
  state.vy = Math.max(-MAX_FALL, Math.min(MAX_RISE, state.vy - GRAVITY * dt))
  state.y += state.vy * dt
  if (state.y > CEIL_Y - PLAYER_R) {
    state.y = CEIL_Y - PLAYER_R
    state.vy = Math.min(0, state.vy)
  }
  if (state.y < FLOOR_Y + PLAYER_R) {
    state.y = FLOOR_Y + PLAYER_R
    state.vy = 0
    if (state.phase === 'playing') {
      state.phase = 'dead'
      events.died = true
    }
  }
  if (state.phase !== 'playing') return events

  state.time += dt
  const move = state.speed * dt
  state.distance += move
  for (const column of state.columns) {
    column.x -= move
    if (column.drift) column.gapY = gapAt(column, state.time)
    if (!column.passed && column.x + COLUMN_HIT_W / 2 < PLAYER_X - PLAYER_R) {
      column.passed = true
      state.score += 1
      state.speed = speedFor(state.score)
      events.scored = true
    }
  }
  if (state.columns.length && state.columns[0].x < -FIELD_W / 2 - COLUMN_W * 2) state.columns.shift()
  while (state.distance >= state.nextAt) {
    const x = FIRST_COLUMN_X - (state.distance - state.nextAt)
    state.columns.push(spawn(state, x))
    state.nextAt += SPACING
  }

  for (const column of state.columns) {
    if (hitsColumn(column, state.y)) {
      state.phase = 'dead'
      events.died = true
      // A little knock back from whatever it swam into.
      state.vy = Math.min(state.vy, 1.5)
      break
    }
  }
  return events
}
