import { describe, expect, it } from 'vitest'
import {
  CEIL_Y,
  FLOOR_Y,
  GAP_MIN,
  PLAYER_R,
  PLAYER_X,
  SPACING,
  SPEED_MAX,
  createRiptide,
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

  it('detects touching either half of a column', () => {
    const column: Column = { id: 1, x: PLAYER_X, gapY: 6, gap: 3, kind: 'rock', variant: 0, passed: false }
    expect(hitsColumn(column, 6)).toBe(false)
    expect(hitsColumn(column, 7.4)).toBe(true)
    expect(hitsColumn(column, 4.6)).toBe(true)
    expect(hitsColumn({ ...column, x: PLAYER_X + 3 }, 7.4)).toBe(false)
  })
})
