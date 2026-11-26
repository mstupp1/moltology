import { describe, expect, it } from 'vitest'
import {
  CEIL_Y,
  FLOOR_Y,
  GAP_MIN,
  PLAYER_R,
  PLAYER_X,
  SPACING,
  SPEED_MAX,
  DRIFT_FROM,
  DRIFT_MAX,
  createRiptide,
  driftFor,
  gapFor,
  hitsColumn,
  stepRiptide,
  type Column,
  type RiptideState,
} from './riptide-sim'
import { ARCADE_GAMES, arcadeScoreCeiling } from '../arcade'

const DT = 1 / 120

/** Steers through every gap: kicks whenever it sinks below the middle of the next gap. */
function autopilot(state: RiptideState, seconds: number) {
  let kicksIn = 0
  for (let i = 0; i < seconds / DT && state.phase !== 'dead'; i++) {
    const next = state.columns.find((c) => !c.passed)
    const target = next ? next.gapY - next.gap * 0.15 : 6
    const kick = state.phase === 'ready' || (state.y < target && state.vy <= 0 && kicksIn <= 0)
    if (kick) kicksIn = 0.18
    kicksIn -= DT
    stepRiptide(state, DT, kick)
  }
}

/**
 * A stronger player for proving runs can be won: every 6 steps it looks ~0.9 s ahead (kick or not,
 * at each 6-step block) and only kicks when not kicking leads to a crash.
 */
const BLOCK = 6
const LOOKAHEAD = 20
function copy(state: RiptideState): RiptideState {
  return { ...state, columns: state.columns.map((c) => ({ ...c })), rng: () => 0.5 }
}
function lives(state: RiptideState, depth: number): boolean {
  if (state.phase === 'dead') return false
  if (depth === 0) return true
  for (const kick of [false, true]) {
    const next = copy(state)
    for (let i = 0; i < BLOCK && next.phase !== 'dead'; i++) stepRiptide(next, DT, kick && i === 0)
    if (lives(next, depth - 1)) return true
  }
  return false
}
function searchAutopilot(state: RiptideState, seconds: number) {
  if (state.phase === 'ready') stepRiptide(state, DT, true)
  for (let b = 0; b < seconds / (DT * BLOCK) && (state.phase as string) !== 'dead'; b++) {
    const coast = copy(state)
    for (let i = 0; i < BLOCK; i++) stepRiptide(coast, DT, false)
    const kick = !lives(coast, LOOKAHEAD - 1)
    for (let i = 0; i < BLOCK && (state.phase as string) !== 'dead'; i++) stepRiptide(state, DT, kick && i === 0)
  }
}

describe('riptide sim', () => {
  it('waits for the first kick', () => {
    const state = createRiptide(1)
    for (let i = 0; i < 240; i++) stepRiptide(state, DT, false)
    expect(state.phase).toBe('ready')
    expect(state.columns).toHaveLength(0)
    stepRiptide(state, DT, true)
    expect(state.phase).toBe('playing')
    expect(state.vy).toBeGreaterThan(0)
  })

  it('ends the run on the seabed', () => {
    const state = createRiptide(2)
    stepRiptide(state, DT, true)
    let died = false
    for (let i = 0; i < 600 && !died; i++) died = stepRiptide(state, DT, false).died
    expect(died).toBe(true)
    expect(state.y).toBeCloseTo(FLOOR_Y + PLAYER_R)
  })

  it('keeps the swimmer under the surface', () => {
    const state = createRiptide(3)
    for (let i = 0; i < 240; i++) stepRiptide(state, DT, i % 6 === 0)
    expect(state.y).toBeLessThanOrEqual(CEIL_Y - PLAYER_R)
  })

  it('is the same run for the same seed', () => {
    const a = createRiptide(42)
    const b = createRiptide(42)
    autopilot(a, 20)
    autopilot(b, 20)
    expect(a.score).toBe(b.score)
    expect(a.columns.map((c) => c.gapY)).toEqual(b.columns.map((c) => c.gapY))
  })

  it('can be played well, and spaces columns evenly', () => {
    const state = createRiptide(7)
    autopilot(state, 40)
    expect(state.score).toBeGreaterThan(10)
    for (let i = 1; i < state.columns.length; i++) {
      expect(state.columns[i].x - state.columns[i - 1].x).toBeCloseTo(SPACING, 5)
    }
  })

  it('narrows the gap and speeds up, within limits', () => {
    expect(gapFor(0)).toBeGreaterThan(gapFor(20))
    expect(gapFor(10_000)).toBe(GAP_MIN)
    const state = createRiptide(9)
    state.score = 10_000
    stepRiptide(state, DT, true)
    expect(state.speed).toBeLessThanOrEqual(SPEED_MAX)
  })

  it('never scores faster than the server allows', () => {
    const state = createRiptide(11)
    autopilot(state, 60)
    const ceiling = arcadeScoreCeiling(ARCADE_GAMES.riptide, state.time * 1000)
    expect(state.score).toBeLessThanOrEqual(ceiling)
  })

  it('drifts the gaps late in a run and keeps them reachable', () => {
    expect(driftFor(DRIFT_FROM - 1)).toBe(0)
    expect(driftFor(DRIFT_FROM + 5)).toBeGreaterThan(0)
    expect(driftFor(10_000)).toBe(DRIFT_MAX)
    for (const seed of [3, 17, 29, 41, 77, 123, 5, 6]) {
      const state = createRiptide(seed)
      state.score = DRIFT_FROM + 40
      state.speed = SPEED_MAX
      searchAutopilot(state, 60)
      expect(state.columns.some((c) => c.drift > 0)).toBe(true)
      expect(state.phase).toBe('playing')
      for (const c of state.columns) {
        expect(c.gapY - c.gap / 2).toBeGreaterThan(FLOOR_Y)
        expect(c.gapY + c.gap / 2).toBeLessThan(CEIL_Y)
      }
    }
  })

  it('detects touching either half of a column', () => {
    const column: Column = { id: 1, x: PLAYER_X, gapY: 6, baseY: 6, drift: 0, phase: 0, gap: 3, kind: 'rock', variant: 0, passed: false }
    expect(hitsColumn(column, 6)).toBe(false)
    expect(hitsColumn(column, 7.4)).toBe(true)
    expect(hitsColumn(column, 4.6)).toBe(true)
    expect(hitsColumn({ ...column, x: PLAYER_X + 3 }, 7.4)).toBe(false)
  })
})
