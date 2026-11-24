/**
 * Current Runner's rules, free of any drawing: the runner, the current that speeds it along the
 * seafloor, and the urchins, coral and jellyfish in its way. The renderer
 * (current-runner-scene.ts) reads this state each frame; tests drive it directly.
 *
 * World units: the play field is FIELD_W wide and FIELD_H tall (16:9) on every screen, so no one
 * sees further ahead. x runs left to right with the runner fixed at PLAYER_X, y runs up from the
 * sand at 0. The score is metres run (one unit is a metre).
 */
import { seededRandom } from './riptide-sim'

export { seededRandom }

export const FIELD_W = 12
export const FIELD_H = 6.75
export const PLAYER_X = -4
/** Hit box of the runner: half its width, and its height standing and ducked. */
export const PLAYER_HALF_W = 0.32
export const PLAYER_H = 1.4
export const PLAYER_DUCK_H = 0.78

export const JUMP_SPEED = 10.6
/** Gravity while the jump is held on the way up (a longer, higher jump)... */
export const GRAVITY_HELD = 24
/** ...and otherwise. */
export const GRAVITY = 40
/** Pressing down in the air drops it fast. */
export const GRAVITY_DIVE = 110
/** A press this soon before landing still jumps on landing. */
export const JUMP_BUFFER = 0.12

export const SPEED_START = 6
/** Units a second gained each second. */
export const SPEED_ACCEL = 0.11
export const SPEED_MAX = 13

/** Where the first obstacle appears, ahead of the runner. */
export const FIRST_AT = 14
/** Obstacles appear here, just past the right edge of the field. */
export const SPAWN_X = FIELD_W / 2 + 1.5

export type ObstacleKind = 'urchin' | 'urchins' | 'coral' | 'jelly-low' | 'jelly-high' | 'jelly-ground'

export interface Obstacle {
  id: number
  kind: ObstacleKind
  /** Middle of the obstacle. */
  x: number
  /** Bottom and height of its hit box, and its width. */
  y: number
  h: number
  w: number
  /** Spines across, for urchin clusters. */
  count: number
  /** A per-obstacle number for the renderer's shapes and colours. */
  variant: number
}

/** Size of each kind of obstacle's hit box (bottom, height, width for one). */
export const OBSTACLE_BOX: Record<ObstacleKind, { y: number; h: number; w: number }> = {
  urchin: { y: 0, h: 0.62, w: 0.66 },
  urchins: { y: 0, h: 0.62, w: 0.6 },
  coral: { y: 0, h: 1.15, w: 0.7 },
  // Floats at head height: duck under it, or jump it early.
  'jelly-low': { y: 0.95, h: 0.75, w: 0.8 },
  // Floats above the runner's head: run under it, but do not jump into it.
  'jelly-high': { y: 1.75, h: 0.75, w: 0.8 },
  // Skims the sand: jump it.
  'jelly-ground': { y: 0.15, h: 0.7, w: 0.8 },
}

export type Phase = 'ready' | 'playing' | 'dead'

export interface RunnerState {
  phase: Phase
  /** Seconds since the run started (the first jump). */
  time: number
  /** Height of the runner's feet above the sand, and its upward speed. */
  y: number
  vy: number
  grounded: boolean
  ducking: boolean
  speed: number
  /** Distance run, in metres; the score is its whole part. */
  distance: number
  score: number
  obstacles: Obstacle[]
  /** Distance at which the next obstacle appears. */
  nextAt: number
  nextId: number
  /** Seconds since a jump was pressed that has not been used yet (Infinity for none). */
  buffered: number
  rng: () => number
}

export interface RunnerInput {
  /** A jump press since the last step. */
  jump: boolean
  /** Jump still held (a higher jump). */
  jumpHeld: boolean
  /** Down held: duck on the sand, dive in the air. */
  down: boolean
}

export interface StepEvents {
  jumped: boolean
  landed: boolean
  /** Every 100 metres. */
  milestone: boolean
  died: boolean
}

export function createRunner(seed: number): RunnerState {
  return {
    phase: 'ready',
    time: 0,
    y: 0,
    vy: 0,
    grounded: true,
    ducking: false,
    speed: SPEED_START,
    distance: 0,
    score: 0,
    obstacles: [],
    nextAt: FIRST_AT - (SPAWN_X - PLAYER_X),
    nextId: 1,
    buffered: Infinity,
    rng: seededRandom(seed),
  }
}

export function speedAt(time: number): number {
  return Math.min(SPEED_MAX, SPEED_START + time * SPEED_ACCEL)
}

/** Which obstacles can turn up this far into a run, with their weights. */
export function obstacleMix(distance: number): [ObstacleKind, number][] {
  const mix: [ObstacleKind, number][] = [
    ['urchin', 5],
    ['urchins', distance < 120 ? 2 : 4],
    ['coral', distance < 60 ? 0 : 2],
  ]
  if (distance >= 250) mix.push(['jelly-low', 2.5], ['jelly-ground', 1.2], ['jelly-high', 1])
  return mix.filter(([, w]) => w > 0)
}

function pick(state: RunnerState): ObstacleKind {
  const mix = obstacleMix(state.distance)
  const total = mix.reduce((sum, [, w]) => sum + w, 0)
  let roll = state.rng() * total
  for (const [kind, w] of mix) {
    roll -= w
    if (roll < 0) return kind
  }
  return mix[0][0]
}

function spawn(state: RunnerState, x: number): Obstacle {
  const kind = pick(state)
  const box = OBSTACLE_BOX[kind]
  const count = kind === 'urchins' ? (state.distance > 400 && state.rng() < 0.4 ? 3 : 2) : 1
  const w = box.w * count
  return { id: state.nextId++, kind, x: x + w / 2, y: box.y, h: box.h, w, count, variant: state.rng() }
}

/**
 * The gap before the next obstacle: always room to land and jump again at this speed, and more
 * room now and then for a breather.
 */
export function gapAfter(obstacle: Obstacle, speed: number, roll: number): number {
  const seconds = 0.85 + roll * 1.1 + (roll > 0.9 ? 0.6 : 0)
  return obstacle.w + speed * seconds
}

/** The runner's hit box this step. */
export function playerBox(state: RunnerState) {
  const h = state.ducking ? PLAYER_DUCK_H : PLAYER_H
  return { left: PLAYER_X - PLAYER_HALF_W, right: PLAYER_X + PLAYER_HALF_W, bottom: state.y, top: state.y + h }
}

/** Whether the runner touches an obstacle; boxes are trimmed a little so grazes feel fair. */
export function hits(state: RunnerState, o: Obstacle): boolean {
  const p = playerBox(state)
  const trim = 0.08
  const left = o.x - o.w / 2 + trim
  const right = o.x + o.w / 2 - trim
  const bottom = o.y + (o.y > 0 ? trim : 0)
  const top = o.y + o.h - trim
  return p.right > left && p.left < right && p.top > bottom && p.bottom < top
}

/**
 * Move the game on by `dt` seconds. Steps should be small (the game runs fixed 1/120 s steps).
 */
export function stepRunner(state: RunnerState, dt: number, input: RunnerInput): StepEvents {
  const events: StepEvents = { jumped: false, landed: false, milestone: false, died: false }
  if (state.phase === 'ready') {
    if (!input.jump) return events
    state.phase = 'playing'
  }

  if (state.phase === 'dead') {
    // Knocked back, it falls to the sand and stays there.
    if (!state.grounded) {
      state.vy -= GRAVITY * dt
      state.y += state.vy * dt
      if (state.y <= 0) {
        state.y = 0
        state.vy = 0
        state.grounded = true
      }
    }
    return events
  }

  state.time += dt
  state.buffered = input.jump ? 0 : state.buffered + dt

  if (state.grounded && state.buffered <= JUMP_BUFFER) {
    state.vy = JUMP_SPEED
    state.grounded = false
    state.buffered = Infinity
    events.jumped = true
  }

  if (!state.grounded) {
    const g = input.down ? GRAVITY_DIVE : input.jumpHeld && state.vy > 0 ? GRAVITY_HELD : GRAVITY
    state.vy -= g * dt
    state.y += state.vy * dt
    if (state.y <= 0) {
      state.y = 0
      state.vy = 0
      state.grounded = true
      events.landed = true
    }
  }
  state.ducking = state.grounded && input.down

  state.speed = speedAt(state.time)
  const move = state.speed * dt
  const before = Math.floor(state.distance / 100)
  state.distance += move
  state.score = Math.floor(state.distance)
  if (Math.floor(state.distance / 100) > before) events.milestone = true

  for (const o of state.obstacles) o.x -= move
  while (state.obstacles.length && state.obstacles[0].x + state.obstacles[0].w / 2 < -FIELD_W / 2 - 2) state.obstacles.shift()
  while (state.distance >= state.nextAt) {
    const o = spawn(state, SPAWN_X - (state.distance - state.nextAt))
    state.obstacles.push(o)
    state.nextAt += gapAfter(o, state.speed, state.rng())
  }

  for (const o of state.obstacles) {
    if (hits(state, o)) {
      state.phase = 'dead'
      events.died = true
      // Knocked up and back off whatever it ran into.
      state.vy = Math.max(state.vy, 4.5)
      state.grounded = false
      state.ducking = false
      break
    }
  }
  return events
}
