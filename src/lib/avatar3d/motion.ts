/**
 * How a character moves when nobody is posing it: the idle (breathing, shifting its weight,
 * glancing about, the odd claw snap), set by its temperament, and the short reactions it plays
 * when it is poked, handed new gear or saved.
 */
import type { AvatarTemperament } from '../avatar/traits'

export interface Mood {
  /** Breaths per second, as an angular rate, and how deep they are. */
  breathRate: number
  breathDepth: number
  /** Side to side shift of the weight, in units, and its rate. */
  sway: number
  swayRate: number
  /** Up and down bounce, in units, and its rate. */
  bounce: number
  bounceRate: number
  /** Sideways head tilt, in radians. */
  tilt: number
  /** How far the eyes wander, in degrees, how often, and how long each glance is held. */
  glance: number
  glanceEvery: number
  glanceHold: number
  /** Seconds between blinks, roughly. */
  blinkEvery: number
  /** Seconds between idle claw snaps (0 for never). */
  snapEvery: number
  /** Antenna and tail movement, as multiples of the calm amount. */
  antennae: number
  tail: number
  /** Standing posture: chest lean forward (radians), arms held out from the body (radians), hips sunk (fraction of leg). */
  lean: number
  arms: number
  sink: number
  /** How strongly the eyes and head follow the pointer (0 to 1). */
  follow: number
}

export const MOODS: Record<AvatarTemperament, Mood> = {
  calm: { breathRate: 1.5, breathDepth: 1, sway: 0.012, swayRate: 0.45, bounce: 0, bounceRate: 0, tilt: 0.012, glance: 9, glanceEvery: 5.5, glanceHold: 1.1, blinkEvery: 4.2, snapEvery: 0, antennae: 1, tail: 1, lean: 0, arms: 0, sink: 0, follow: 0.85 },
  lively: { breathRate: 2.6, breathDepth: 1.3, sway: 0.02, swayRate: 1.1, bounce: 0.014, bounceRate: 5.2, tilt: 0.03, glance: 15, glanceEvery: 2.2, glanceHold: 0.6, blinkEvery: 2.8, snapEvery: 6.5, antennae: 2.2, tail: 2.4, lean: -0.02, arms: 0.05, sink: 0, follow: 1 },
  shy: { breathRate: 1.9, breathDepth: 0.8, sway: 0.008, swayRate: 0.6, bounce: 0, bounceRate: 0, tilt: 0.02, glance: 13, glanceEvery: 3.1, glanceHold: 0.45, blinkEvery: 2.2, snapEvery: 0, antennae: 0.7, tail: 0.5, lean: 0.085, arms: -0.1, sink: 0.035, follow: 0.45 },
  proud: { breathRate: 1.2, breathDepth: 1.5, sway: 0.016, swayRate: 0.3, bounce: 0, bounceRate: 0, tilt: 0.008, glance: 6, glanceEvery: 7, glanceHold: 1.6, blinkEvery: 5.5, snapEvery: 0, antennae: 0.8, tail: 0.8, lean: -0.075, arms: 0.09, sink: -0.01, follow: 0.6 },
  goofy: { breathRate: 2, breathDepth: 1.1, sway: 0.034, swayRate: 0.9, bounce: 0.006, bounceRate: 3.6, tilt: 0.085, glance: 20, glanceEvery: 2.8, glanceHold: 0.9, blinkEvery: 3.4, snapEvery: 4.2, antennae: 2.6, tail: 3, lean: 0.01, arms: 0.04, sink: 0.01, follow: 1 },
}

export type Reaction = 'poke' | 'snap' | 'equip' | 'celebrate'

/** How long each reaction runs, in seconds. */
export const REACTION_SECONDS: Record<Reaction, number> = { poke: 0.75, snap: 0.6, equip: 0.9, celebrate: 1.7 }

/** A steady number in 0..1 for a whole number, so idle timing varies without being random. */
export function jitter(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** 0 → 1 → 0 over p in 0..1. */
export const arc = (p: number) => Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI)
/** A hop: up and down again `count` times over p in 0..1. */
export const hops = (p: number, count: number) => Math.abs(Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI * count))
