import { describe, expect, it } from 'vitest'
import {
  BOUNCE_HEIGHT,
  BOUNCE_SPEED,
  HARDEST_AT,
  FIELD_W,
  GRAVITY,
  HALF_W,
  MAX_STEP,
  STEER_SPEED,
  createHopper,
  hitsUrchin,
  layPads,
  stepHopper,
  stepUp,
  wrapDelta,
  type HopperState,
  type Pad,
} from './vent-hopper-sim'
import { ARCADE_GAMES, isPlausibleScore } from '../arcade'

const DT = 1 / 120

/** Where the climber's flight will top out. */
function apexOf(s: HopperState): number {
  return s.y + Math.max(0, s.vy) ** 2 / (2 * GRAVITY)
}

/** Seconds until falling feet reach height `y` (Infinity if they never will). */
function timeToFall(s: HopperState, y: number): number {
  // y(t) = s.y + vy t - g t² / 2 = target
  const a = GRAVITY / 2
  const b = -s.vy
  const c = y - s.y
  const disc = b * b - 4 * a * c
  if (disc < 0) return Infinity
  return (-b + Math.sqrt(disc)) / (2 * a)
}

/** Where a pad will be in `t` seconds. */
function padXAt(p: Pad, t: number): number {
  if (p.kind !== 'drift') return p.x
  const half = HALF_W - p.w / 2
  // Fold the straight-line position back into the pad's lane.
  const span = half * 2
  let u = (p.x + half + p.vx * t) % (2 * span)
  if (u < 0) u += 2 * span
  return (u > span ? 2 * span - u : u) - half
}

/** Whether an urchin will cross the column the climber flies through before it gets past. */
function blocked(s: HopperState, from: number, to: number, x: number): boolean {
  return s.urchins.some((u) => u.y > from - 0.5 && u.y < to + 2 && Math.abs(wrapDelta(x, u.x + u.vx * 0.5)) < 2.2)
}

/** Pads the climber can still come down on from where it is now, highest first. */
function reachable(s: HopperState, pads: Pad[], below: number, above: number): Pad[] {
  return pads
    .filter((p) => p.y > below && p.y <= above && p.y >= s.camY - 0.5)
    .filter((p) => {
      const t = timeToFall(s, p.y)
      return p.kind === 'floor' || Math.abs(wrapDelta(s.x, padXAt(p, t))) <= STEER_SPEED * t * 0.75 + p.w / 2 - 0.1
    })
    .sort((a, b) => b.y - a.y)
}

const committed = new WeakMap<HopperState, number>()

/** Plays well: climbs pad by pad, waits on a solid pad while an urchin drifts past overhead. */
function steerFor(s: HopperState): number {
  const pads = s.pads.filter((p) => !p.broken)
  const cur = pads.find((p) => p.id === s.lastPad)
  const base = cur?.y ?? s.y
  let aim: Pad | undefined
  if (s.vy > 0) {
    // Stick with the pad picked on the way up, so it does not dither between two.
    const kept = pads.find((p) => p.id === committed.get(s))
    const options = reachable(s, pads, base + 0.3, apexOf(s) - 0.15)
    aim = kept && options.includes(kept) ? kept : options[0]
    if (aim) committed.set(s, aim.id)
    if (aim && cur && cur.kind !== 'brittle' && blocked(s, base, aim.y, aim.x)) aim = cur
    aim ??= cur
  } else {
    aim = reachable(s, pads, -Infinity, s.y + 0.01)[0]
    // Nothing surely in reach: make for whichever pad below is nearest sideways.
    aim ??= pads.filter((p) => p.y <= s.y && p.y >= s.camY).sort((a, b) => Math.abs(wrapDelta(s.x, a.x)) - Math.abs(wrapDelta(s.x, b.x)))[0]
  }
  // Keep clear of any urchin close by.
  for (const u of s.urchins) {
    const dx = wrapDelta(s.x, u.x)
    if (Math.abs(u.y - (s.y + 0.5)) < 1.4 && Math.abs(dx) < 1.3) return dx > 0 ? -1 : 1
  }
  if (!aim || aim.kind === 'floor') return 0
  const t = timeToFall(s, aim.y)
  const dx = wrapDelta(s.x, padXAt(aim, Number.isFinite(t) ? t : 0))
  return Math.max(-1, Math.min(1, dx * 3))
}

function copyOf(s: HopperState): HopperState {
  return {
    ...s,
    pads: s.pads.map((p) => ({ ...p })),
    urchins: s.urchins.map((u) => ({ ...u, r: u.r + 0.15 })),
    rng: () => 0.5,
  }
}

/**
 * Near an urchin, look ahead: try holding each steer for a moment before going back to climbing,
 * and take the first that neither touches an urchin nor falls.
 */
function plannedSteer(s: HopperState): number {
  const aim = steerFor(s)
  if (!s.urchins.some((u) => u.y > s.y - 1.5 && u.y < s.y + 6)) return aim
  let best = aim
  let bestScore = -Infinity
  for (const [steer, hold] of [aim, 0, -1, 1, -0.5, 0.5].map((v) => [v, 0.4])) {
    const probe = copyOf(s)
    let ok = true
    let landedOn = -Infinity
    for (let i = 0; i < 3 * 60; i++) {
      const e = stepHopper(probe, 1 / 60, {
        start: false,
        steer: i < hold * 60 ? steer : steerFor(probe),
      })
      // Falling close to the bottom of the view counts as lost.
      if (e.hit || probe.phase === 'dead' || probe.y < probe.camY + 1) {
        ok = false
        break
      }
      if (e.bounced) landedOn = probe.y
    }
    if (!ok) continue
    // Judge by the highest ground reached, not where it happens to be in the air.
    const score = landedOn + (steer === aim ? 0.5 : 0) - hold
    if (score > bestScore) {
      bestScore = score
      best = steer
    }
  }
  return best
}

function autopilot(state: HopperState, seconds: number) {
  let steer = 0
  for (let i = 0; i < seconds / DT && state.phase !== 'dead'; i++) {
    // Looking ahead is slow, so it is redone every few steps.
    if (i % 3 === 0) steer = plannedSteer(state)
    stepHopper(state, DT, { start: state.phase === 'ready', steer })
  }
}

describe('vent hopper sim', () => {
  it('waits for the first press, then bounces off the floor', () => {
    const state = createHopper(1)
    for (let i = 0; i < 240; i++) stepHopper(state, DT, { start: false, steer: 1 })
    expect(state.phase).toBe('ready')
    expect(state.x).toBe(0)
    const events = stepHopper(state, DT, { start: true, steer: 0 })
    expect(events.bounced).toBe('floor')
    expect(state.vy).toBeGreaterThan(0)
  })

  it('wraps round from one side to the other', () => {
    const state = createHopper(2)
    stepHopper(state, DT, { start: true, steer: 0 })
    for (let i = 0; i < 120; i++) stepHopper(state, DT, { start: false, steer: 1 })
    expect(Math.abs(state.x)).toBeLessThanOrEqual(HALF_W)
    expect(wrapDelta(4, -4)).toBeCloseTo(1, 5)
    expect(wrapDelta(-4.4, 4.4)).toBeCloseTo(-0.2, 5)
  })

  it('never lays a step on the path higher than one bounce reaches', () => {
    for (const h of [0, 500, 5000]) for (const roll of [0, 0.5, 1]) expect(stepUp(h, roll)).toBeLessThanOrEqual(MAX_STEP)
    expect(MAX_STEP).toBeLessThan(BOUNCE_HEIGHT)
    // All the way up past the hardest height: brittle coral aside, no gap is out of reach, and with
    // the wrap-around one bounce covers any sideways distance (half the field) before landing.
    for (let seed = 1; seed <= 5; seed++) {
      const state = createHopper(seed)
      layPads(state, HARDEST_AT * 2)
      const path = state.pads.filter((p) => p.kind !== 'brittle').sort((a, b) => a.y - b.y)
      for (let i = 1; i < path.length; i++) expect(path[i].y - path[i - 1].y).toBeLessThanOrEqual(MAX_STEP + 1e-9)
    }
    const airborne = (2 * BOUNCE_SPEED) / GRAVITY - 0.25
    expect(STEER_SPEED * airborne).toBeGreaterThan(HALF_W + 1)
  })

  it('breaks brittle coral after one bounce', () => {
    const state = createHopper(3)
    stepHopper(state, DT, { start: true, steer: 0 })
    state.pads = []
    state.pads.push({
      id: 999,
      kind: 'brittle',
      x: state.x,
      y: state.y + 2,
      w: 1.5,
      vx: 0,
      broken: false,
      variant: 0,
    })
    let broke = false
    for (let i = 0; i < 240 && !broke; i++) broke = stepHopper(state, DT, { start: false, steer: 0 }).broke
    expect(broke).toBe(true)
    expect(state.pads.find((p) => p.id === 999)?.broken).toBe(true)
  })

  it('an urchin knocks the climber down through the pads for a moment', () => {
    const state = createHopper(4)
    stepHopper(state, DT, { start: true, steer: 0 })
    for (let i = 0; i < 60; i++) stepHopper(state, DT, { start: false, steer: 0 })
    state.pads = [
      {
        id: 997,
        kind: 'sponge',
        x: state.x,
        y: state.y - 0.5,
        w: 1.5,
        vx: 0,
        broken: false,
        variant: 0,
      },
    ]
    state.urchins.push({
      id: 998,
      x: state.x,
      y: state.y + 1.2,
      vx: 0,
      r: 0.34,
      variant: 0,
    })
    let hit = false
    for (let i = 0; i < 120 && !hit; i++) hit = stepHopper(state, DT, { start: false, steer: 1 }).hit
    expect(hit).toBe(true)
    expect(state.knocked).toBeGreaterThan(0)
    // Steering does nothing while knocked, and it drops straight through the pad just below.
    const events = []
    for (let i = 0; i < 12; i++) events.push(stepHopper(state, DT, { start: false, steer: 1 }))
    expect(Math.abs(state.vx)).toBeLessThan(3)
    expect(events.some((e) => e.bounced)).toBe(false)
    expect(state.y).toBeLessThan(state.pads[0].y)
    // Once it wears off, a pad catches it again.
    state.pads.push({
      id: 996,
      kind: 'sponge',
      x: state.x,
      y: state.y - 4,
      w: 3,
      vx: 0,
      broken: false,
      variant: 0,
    })
    let bounced = false
    for (let i = 0; i < 120 && !bounced; i++) bounced = stepHopper(state, DT, { start: false, steer: 0 }).bounced !== null
    expect(bounced).toBe(true)
    expect(state.knocked).toBe(0)
  })

  it('ends the run when the climber falls out of the view', () => {
    const state = createHopper(5)
    autopilot(state, 6)
    state.pads = []
    for (let i = 0; i < 120 * 5 && state.phase !== 'dead'; i++) stepHopper(state, DT, { start: false, steer: 0 })
    expect(state.phase).toBe('dead')
    expect(state.score).toBeGreaterThan(10)
  })

  it('keeps every pad inside the field', () => {
    const state = createHopper(6)
    autopilot(state, 30)
    for (const p of state.pads) if (p.kind !== 'floor') expect(Math.abs(p.x) + p.w / 2).toBeLessThanOrEqual(FIELD_W / 2)
  })

  it('can be climbed for three minutes on many seeds, and every score passes the server check', { timeout: 60_000 }, () => {
    for (let seed = 1; seed <= 16; seed++) {
      const state = createHopper(seed)
      autopilot(state, 180)
      expect(state.phase, `seed ${seed} fell at ${state.score} m`).toBe('playing')
      expect(state.score).toBeGreaterThan(400)
      expect(isPlausibleScore(ARCADE_GAMES['vent-hopper'], state.score, state.time * 1000)).toBe(true)
    }
  })
})
