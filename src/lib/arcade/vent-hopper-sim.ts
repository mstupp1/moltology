/**
 * Vent Hopper's rules, free of any drawing: the climber that bounces off every pad it lands on,
 * the sponge pads, drifting pads, brittle coral and clam springs stacked up toward the surface, and
 * the spiny urchins that drift across higher up and knock the climber down when touched. The renderer (vent-hopper-scene.ts) reads this
 * state each frame; tests drive it directly.
 *
 * World units: the play field is FIELD_W wide and FIELD_H tall (9:16) on every screen, so no one
 * sees further up. x runs left to right from the middle, y runs up from the seafloor at 0. Going
 * off one side brings the climber back on the other. The score is metres climbed (one unit is a
 * metre): the highest the climber's feet have been.
 */
import { seededRandom } from './riptide-sim'

export { seededRandom }

export const FIELD_W = 9
export const FIELD_H = 16
export const HALF_W = FIELD_W / 2

/** Hit box of the climber: half its width and its height above the feet. */
export const PLAYER_HALF_W = 0.3
export const PLAYER_H = 0.95

export const GRAVITY = 28
/** Upward speed off a pad: about 3.5 m high. */
export const BOUNCE_SPEED = 14
/** Upward speed off a clam spring: about 9.6 m high. */
export const SPRING_SPEED = 23.2
export const MAX_FALL = 22
/** Sideways top speed, and how fast the climber gets there (per second). */
export const STEER_SPEED = 9
export const STEER_RESPONSE = 12

/** Height of one ordinary bounce (v² / 2g). */
export const BOUNCE_HEIGHT = (BOUNCE_SPEED * BOUNCE_SPEED) / (2 * GRAVITY)
/** The largest step from one pad of the climbing path to the next: well inside one bounce. */
export const MAX_STEP = BOUNCE_HEIGHT * 0.8

/** Where the camera keeps the climber, as a share of the view height from the bottom. */
export const FOLLOW_AT = 0.42
/** How long an urchin's knock lasts, and how fast it sends the climber down. */
export const KNOCK_SECONDS = 0.35
export const KNOCK_SPEED = -6
/** The climber is gone once its head is this far below the bottom of the view. */
export const LOST_BELOW = 0.6

/** Heights (metres) where new pads and hazards start turning up. */
export const DRIFT_FROM = 60
export const BRITTLE_FROM = 140
export const URCHIN_FROM = 300
/** Height at which the climb is as hard as it gets. */
export const HARDEST_AT = 1200

export type PadKind = 'floor' | 'sponge' | 'drift' | 'brittle' | 'clam'

export interface Pad {
  id: number
  kind: PadKind
  /** Middle of the pad and the height of its top. */
  x: number
  y: number
  /** Width (the full field for the floor). */
  w: number
  /** Sideways speed, for drifting pads. */
  vx: number
  /** Brittle coral that has been bounced on once and is falling apart. */
  broken: boolean
  /** A per-pad number for the renderer's shapes and colours. */
  variant: number
}

export interface Urchin {
  id: number
  x: number
  /** Middle of the urchin. */
  y: number
  vx: number
  r: number
  variant: number
}

export type Phase = 'ready' | 'playing' | 'dead'

export interface HopperState {
  phase: Phase
  /** Seconds since the run started. */
  time: number
  /** Middle of the climber's feet, and its speed. */
  x: number
  y: number
  vx: number
  vy: number
  /** Facing: 1 to the right, -1 to the left (the last way it steered). */
  facing: 1 | -1
  /** Seconds left of being knocked down by an urchin: no steering, and it drops through pads. */
  knocked: number
  /** Urchins hit this run. */
  knocks: number
  /** Highest the feet have been; the score is its whole part. */
  best: number
  score: number
  /** Bottom of the view. It only ever rises. */
  camY: number
  pads: Pad[]
  urchins: Urchin[]
  /** The pad bounced on last (null before the first). */
  lastPad: number | null
  /** Height of the highest pad of the climbing path so far. */
  topY: number
  /** Height at which the next urchin may appear. */
  nextUrchinAt: number
  nextId: number
  rng: () => number
}

export interface HopperInput {
  /** A press since the last step (starts the run). */
  start: boolean
  /** Steering, -1 (left) to 1 (right); tilt gives values in between. */
  steer: number
}

export interface StepEvents {
  /** The kind of pad bounced on this step, if any. */
  bounced: PadKind | null
  /** A brittle pad broke under the climber. */
  broke: boolean
  /** Hit an urchin. */
  hit: boolean
  /** Every 100 metres. */
  milestone: boolean
  /** Dropped out of the view: the run is over. */
  died: boolean
}

/** How hard the climb is at this height, 0 to 1. */
export function difficulty(height: number): number {
  return Math.min(1, Math.max(0, height / HARDEST_AT))
}

export function padWidth(kind: PadKind, height: number): number {
  if (kind === 'floor') return FIELD_W
  if (kind === 'clam') return 1.05
  return 1.75 - 0.55 * difficulty(height)
}

/**
 * Which pads can turn up at this height on the climbing path, with their weights. Brittle coral is
 * never part of the path (a broken step could leave a gap no bounce reaches); it only turns up
 * beside it, as a decoy or a lucky extra step.
 */
export function padMix(height: number): [PadKind, number][] {
  const d = difficulty(height)
  const mix: [PadKind, number][] = [
    ['sponge', 10 - 5 * d],
    ['drift', height < DRIFT_FROM ? 0 : 1.5 + 3 * d],
    ['clam', height < 20 ? 0 : 0.6],
  ]
  return mix.filter(([, w]) => w > 0)
}

function pickKind(state: HopperState, height: number): PadKind {
  const mix = padMix(height)
  const total = mix.reduce((sum, [, w]) => sum + w, 0)
  let roll = state.rng() * total
  for (const [kind, w] of mix) {
    roll -= w
    if (roll < 0) return kind
  }
  return mix[0][0]
}

/** The rise from one pad of the climbing path to the next: always reachable in one bounce. */
export function stepUp(height: number, roll: number): number {
  const d = difficulty(height)
  const low = 0.9 + 0.9 * d
  const high = 1.7 + 1.1 * d
  return Math.min(MAX_STEP, low + (high - low) * roll)
}

function addPad(state: HopperState, kind: PadKind, x: number, y: number): Pad {
  const w = padWidth(kind, y)
  const half = HALF_W - w / 2 - 0.1
  const pad: Pad = {
    id: state.nextId++,
    kind,
    x: Math.max(-half, Math.min(half, x)),
    y,
    w,
    vx: 0,
    broken: false,
    variant: state.rng(),
  }
  if (kind === 'drift') pad.vx = (state.rng() < 0.5 ? -1 : 1) * (1 + 1.6 * difficulty(y) + state.rng() * 0.5)
  state.pads.push(pad)
  return pad
}

/** Lay pads and urchins up to `upTo`. */
export function layPads(state: HopperState, upTo: number) {
  while (state.topY < upTo) {
    const y = state.topY + stepUp(state.topY, state.rng())
    const kind = pickKind(state, y)
    // Each new pad lands somewhere the climber can get to from the last: with wrap-around, any x is.
    addPad(state, kind, (state.rng() - 0.5) * (FIELD_W - 1), y)
    state.topY = y
    // Now and then brittle coral beside the path, more often higher up.
    if (y > BRITTLE_FROM && state.rng() < 0.25 + 0.3 * difficulty(y)) {
      const dy = 0.5 + state.rng() * 0.6
      addPad(state, 'brittle', (state.rng() - 0.5) * (FIELD_W - 1), y - dy)
    }
    // An urchin drifts just above a pad of the path; the climber can bounce there in place while it passes.
    if (y >= state.nextUrchinAt) {
      const d = difficulty(y)
      state.urchins.push({
        id: state.nextId++,
        x: (state.rng() - 0.5) * FIELD_W,
        y: y + 0.9 + state.rng() * 0.6,
        vx: (state.rng() < 0.5 ? -1 : 1) * (0.7 + 0.5 * d + state.rng() * 0.3),
        r: 0.34,
        variant: state.rng(),
      })
      state.nextUrchinAt = y + 26 - 8 * d + state.rng() * 10
    }
  }
}

export function createHopper(seed: number): HopperState {
  const state: HopperState = {
    phase: 'ready',
    time: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    knocked: 0,
    knocks: 0,
    best: 0,
    score: 0,
    camY: -1.2,
    pads: [],
    urchins: [],
    lastPad: null,
    topY: 0,
    nextUrchinAt: URCHIN_FROM,
    nextId: 1,
    rng: seededRandom(seed),
  }
  state.pads.push({ id: state.nextId++, kind: 'floor', x: 0, y: 0, w: FIELD_W, vx: 0, broken: false, variant: 0 })
  layPads(state, FIELD_H + 6)
  return state
}

/** Sideways distance from `from` to `to`, the short way round the wrap. */
export function wrapDelta(from: number, to: number): number {
  let d = to - from
  if (d > HALF_W) d -= FIELD_W
  if (d < -HALF_W) d += FIELD_W
  return d
}

/** Whether the climber touches an urchin; trimmed a little so grazes feel fair. */
export function hitsUrchin(state: HopperState, u: Urchin): boolean {
  const dx = Math.abs(wrapDelta(state.x, u.x))
  const nearestY = Math.max(state.y, Math.min(state.y + PLAYER_H, u.y))
  const dy = u.y - nearestY
  const reach = u.r + PLAYER_HALF_W - 0.1
  return dx < reach && Math.abs(dy) < u.r - 0.05 && dx * dx + dy * dy < reach * reach
}

/** Whether feet at `x` over a pad would land on it (a little forgiving at the ends). */
export function overPad(x: number, pad: Pad): boolean {
  if (pad.kind === 'floor') return true
  return Math.abs(wrapDelta(pad.x, x)) <= pad.w / 2 + PLAYER_HALF_W * 0.5
}

/**
 * Move the game on by `dt` seconds. Steps should be small (the game runs fixed 1/120 s steps).
 */
export function stepHopper(state: HopperState, dt: number, input: HopperInput): StepEvents {
  const events: StepEvents = { bounced: null, broke: false, hit: false, milestone: false, died: false }
  if (state.phase === 'dead') return events
  if (state.phase === 'ready') {
    if (!input.start) return events
    state.phase = 'playing'
    state.vy = BOUNCE_SPEED
    state.lastPad = state.pads[0].id
    events.bounced = 'floor'
  }

  state.time += dt
  // Pads drift and turn at the edges; urchins drift and come back round.
  for (const pad of state.pads) {
    if (pad.kind === 'drift') {
      pad.x += pad.vx * dt
      const half = HALF_W - pad.w / 2
      if (pad.x > half) {
        pad.x = half
        pad.vx = -Math.abs(pad.vx)
      } else if (pad.x < -half) {
        pad.x = -half
        pad.vx = Math.abs(pad.vx)
      }
    }
  }
  for (const u of state.urchins) {
    u.x += u.vx * dt
    if (u.x > HALF_W + 0.5) u.x -= FIELD_W + 1
    if (u.x < -HALF_W - 0.5) u.x += FIELD_W + 1
  }

  // Steering eases to the asked-for speed; knocked, the climber just drops.
  const wasKnocked = state.knocked > 0
  state.knocked = Math.max(0, state.knocked - dt)
  const steer = wasKnocked ? 0 : Math.max(-1, Math.min(1, input.steer))
  if (wasKnocked) state.vx *= 1 - Math.min(1, dt * 4)
  else state.vx += (steer * STEER_SPEED - state.vx) * Math.min(1, dt * STEER_RESPONSE)
  if (steer > 0.15) state.facing = 1
  else if (steer < -0.15) state.facing = -1
  state.x += state.vx * dt
  if (state.x > HALF_W) state.x -= FIELD_W
  if (state.x < -HALF_W) state.x += FIELD_W

  const before = state.y
  state.vy = Math.max(-MAX_FALL, state.vy - GRAVITY * dt)
  state.y += state.vy * dt

  // Landing: falling through the top of a pad, feet over it.
  if (!wasKnocked && state.vy < 0) {
    let landed: Pad | null = null
    for (const pad of state.pads) {
      if (pad.broken || before < pad.y || state.y > pad.y || !overPad(state.x, pad)) continue
      if (!landed || pad.y > landed.y) landed = pad
    }
    if (landed) {
      state.y = landed.y
      state.vy = landed.kind === 'clam' ? SPRING_SPEED : BOUNCE_SPEED
      state.lastPad = landed.id
      events.bounced = landed.kind
      if (landed.kind === 'brittle') {
        landed.broken = true
        events.broke = true
      }
    }
  }

  if (!wasKnocked && !events.bounced) {
    for (const u of state.urchins) {
      if (hitsUrchin(state, u)) {
        state.knocked = KNOCK_SECONDS
        state.knocks++
        state.vy = Math.min(state.vy, KNOCK_SPEED)
        // Pushed away from the spines.
        state.vx = Math.sign(wrapDelta(u.x, state.x) || 1) * 3
        events.hit = true
        break
      }
    }
  }

  const hundreds = Math.floor(state.best / 100)
  if (state.y > state.best) {
    state.best = state.y
    state.score = Math.floor(state.best)
    if (Math.floor(state.best / 100) > hundreds) events.milestone = true
  }

  // The view follows the climber up and never comes back down.
  state.camY = Math.max(state.camY, state.y - FIELD_H * FOLLOW_AT)
  if (state.y + PLAYER_H < state.camY - LOST_BELOW) {
    state.phase = 'dead'
    events.died = true
  }

  // Build ahead of the view and let go of what has fallen out of it.
  layPads(state, state.camY + FIELD_H + 6)
  const bottom = state.camY - 3
  if (state.pads.length && state.pads[0].y < bottom) state.pads = state.pads.filter((p) => p.y >= bottom)
  if (state.urchins.length && state.urchins[0].y < bottom) state.urchins = state.urchins.filter((u) => u.y >= bottom)
  return events
}
