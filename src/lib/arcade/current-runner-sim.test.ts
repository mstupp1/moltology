import { describe, expect, it } from 'vitest'
import {
  OBSTACLE_BOX,
  PLAYER_X,
  SPEED_MAX,
  SPEED_START,
  createRunner,
  gapAfter,
  hits,
  stepRunner,
  type Obstacle,
  type RunnerState,
} from './current-runner-sim'
import { ARCADE_GAMES, isPlausibleScore } from '../arcade'

const DT = 1 / 120
const idle = { jump: false, jumpHeld: false, down: false }

/** Plays well: ducks low jellies, ignores high ones, jumps everything else in good time. */
function autopilot(state: RunnerState, seconds: number) {
  let holding = 0
  for (let i = 0; i < seconds / DT && state.phase !== 'dead'; i++) {
    const next = state.obstacles.find((o) => o.x + o.w / 2 > PLAYER_X - 0.4)
    const ahead = next ? next.x - next.w / 2 - PLAYER_X : Infinity
    const lead = state.speed * 0.16 + 0.5
    let jump = state.phase === 'ready'
    let down = false
    if (next && next.kind === 'jelly-low') down = ahead < lead + 0.6
    else if (next && next.kind !== 'jelly-high' && state.grounded && ahead < lead && ahead > 0) jump = true
    // Hold for the tall coral and wide clusters; let go early otherwise.
    if (jump) holding = next && (next.kind === 'coral' || next.count > 2) ? 0.25 : 0.1
    holding -= DT
    stepRunner(state, DT, { jump, jumpHeld: holding > 0, down })
  }
}

function place(kind: Obstacle['kind'], x: number): Obstacle {
  const box = OBSTACLE_BOX[kind]
  return { id: 1, kind, x, y: box.y, h: box.h, w: box.w, count: 1, variant: 0 }
}

describe('current runner sim', () => {
  it('waits for the first jump', () => {
    const state = createRunner(1)
    for (let i = 0; i < 240; i++) stepRunner(state, DT, idle)
    expect(state.phase).toBe('ready')
    expect(state.distance).toBe(0)
    stepRunner(state, DT, { jump: true, jumpHeld: true, down: false })
    expect(state.phase).toBe('playing')
    expect(state.grounded).toBe(false)
  })

  it('a held jump goes higher than a tap', () => {
    const peak = (held: boolean) => {
      const state = createRunner(2)
      let top = 0
      stepRunner(state, DT, { jump: true, jumpHeld: held, down: false })
      for (let i = 0; i < 120; i++) {
        stepRunner(state, DT, { jump: false, jumpHeld: held, down: false })
        top = Math.max(top, state.y)
      }
      return top
    }
    expect(peak(true)).toBeGreaterThan(peak(false) + 0.5)
  })

  it('ducks under a low jelly but not when standing', () => {
    const state = createRunner(3)
    state.phase = 'playing'
    const jelly = place('jelly-low', PLAYER_X)
    expect(hits(state, jelly)).toBe(true)
    state.ducking = true
    expect(hits(state, jelly)).toBe(false)
    // A high jelly clears a standing runner but not one that jumps into it.
    state.ducking = false
    const high = place('jelly-high', PLAYER_X)
    expect(hits(state, high)).toBe(false)
    state.y = 0.8
    expect(hits(state, high)).toBe(true)
  })

  it('ends the run on the first urchin when nobody jumps', () => {
    const state = createRunner(4)
    stepRunner(state, DT, { jump: true, jumpHeld: false, down: false })
    for (let i = 0; i < 120 * 10 && state.phase !== 'dead'; i++) stepRunner(state, DT, idle)
    expect(state.phase).toBe('dead')
    expect(state.score).toBeLessThan(30)
  })

  it('speeds up to its top speed and no further', () => {
    const state = createRunner(5)
    expect(state.speed).toBe(SPEED_START)
    autopilot(state, 120)
    expect(state.speed).toBeLessThanOrEqual(SPEED_MAX)
  })

  it('leaves room to land and jump again', () => {
    const o = place('urchin', 0)
    for (const speed of [SPEED_START, SPEED_MAX]) expect(gapAfter(o, speed, 0)).toBeGreaterThanOrEqual(o.w + speed * 0.85)
  })

  it('can be run for two minutes on many seeds, and every score passes the server check', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const state = createRunner(seed)
      autopilot(state, 120)
      expect(state.phase, `seed ${seed} died at ${state.score} m`).toBe('playing')
      expect(isPlausibleScore(ARCADE_GAMES['current-runner'], state.score, state.time * 1000)).toBe(true)
    }
  })
})
