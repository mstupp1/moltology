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
  /**
   * The short middle legs: how much they ripple (a multiple of the calm amount), seconds between
   * one leg lifting for a tap (0 for never), and how far they are drawn in under the body (radians).
   */
  legs: number
  fidgetEvery: number
  tuck: number
  /** Standing posture: chest lean forward (radians), arms held out from the body (radians), hips sunk (fraction of leg). */
  lean: number
  arms: number
  sink: number
  /** How strongly the eyes and head follow the pointer (0 to 1). */
  follow: number
}

export const MOODS: Record<AvatarTemperament, Mood> = {
  calm: { breathRate: 1.5, breathDepth: 1, sway: 0.012, swayRate: 0.45, bounce: 0, bounceRate: 0, tilt: 0.012, glance: 9, glanceEvery: 5.5, glanceHold: 1.1, blinkEvery: 4.2, snapEvery: 0, antennae: 1, tail: 1, legs: 1, fidgetEvery: 6.5, tuck: 0, lean: 0, arms: 0, sink: 0, follow: 0.85 },
  lively: { breathRate: 2.6, breathDepth: 1.3, sway: 0.02, swayRate: 1.1, bounce: 0.014, bounceRate: 5.2, tilt: 0.03, glance: 15, glanceEvery: 2.2, glanceHold: 0.6, blinkEvery: 2.8, snapEvery: 6.5, antennae: 2.2, tail: 2.4, legs: 1.6, fidgetEvery: 3.2, tuck: 0, lean: -0.02, arms: 0.05, sink: 0, follow: 1 },
  shy: { breathRate: 1.9, breathDepth: 0.8, sway: 0.008, swayRate: 0.6, bounce: 0, bounceRate: 0, tilt: 0.02, glance: 13, glanceEvery: 3.1, glanceHold: 0.45, blinkEvery: 2.2, snapEvery: 0, antennae: 0.7, tail: 0.5, legs: 0.6, fidgetEvery: 5, tuck: 0.14, lean: 0.085, arms: -0.1, sink: 0.035, follow: 0.45 },
  proud: { breathRate: 1.2, breathDepth: 1.5, sway: 0.016, swayRate: 0.3, bounce: 0, bounceRate: 0, tilt: 0.008, glance: 6, glanceEvery: 7, glanceHold: 1.6, blinkEvery: 5.5, snapEvery: 0, antennae: 0.8, tail: 0.8, legs: 0.7, fidgetEvery: 9, tuck: -0.05, lean: -0.075, arms: 0.09, sink: -0.01, follow: 0.6 },
  goofy: { breathRate: 2, breathDepth: 1.1, sway: 0.034, swayRate: 0.9, bounce: 0.006, bounceRate: 3.6, tilt: 0.085, glance: 20, glanceEvery: 2.8, glanceHold: 0.9, blinkEvery: 3.4, snapEvery: 4.2, antennae: 2.6, tail: 3, legs: 2, fidgetEvery: 2.6, tuck: 0, lean: 0.01, arms: 0.04, sink: 0.01, follow: 1 },
}

export type Reaction = 'poke' | 'snap' | 'equip' | 'celebrate'

/** How long each reaction runs, in seconds. */
export const REACTION_SECONDS: Record<Reaction, number> = { poke: 0.75, snap: 0.6, equip: 0.9, celebrate: 1.7 }

/** Talking gestures for scripted animation (character.ts plays them over the pose). */
export const GESTURES = ['beat', 'open', 'offer', 'tilt', 'nod', 'shift'] as const
export type Gesture = (typeof GESTURES)[number]

/** How long each gesture runs, in seconds. */
export const GESTURE_SECONDS: Record<Gesture, number> = { beat: 0.6, open: 1.1, offer: 1.2, tilt: 1.3, nod: 0.8, shift: 1.6 }

/**
 * The shape of a gesture over p in 0..1: a slight pull back the other way, a quick rise to the
 * full gesture a third of the way in, then a slow settle back to the pose with no hard stop.
 */
export function gestureCurve(p: number): number {
  if (p <= 0 || p >= 1) return 0
  if (p < 0.1) return -0.12 * Math.sin((p / 0.1) * Math.PI)
  if (p < 0.32) {
    const q = (p - 0.1) / 0.22
    return 1 - (1 - q) ** 3
  }
  const q = (p - 0.32) / 0.68
  return 0.5 + 0.5 * Math.cos(q * Math.PI)
}

/** A steady number in 0..1 for a whole number, so idle timing varies without being random. */
export function jitter(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * A leg lifting to tap the ground over p in 0..1, as a share of its full lift: up, a quick tap
 * down, half way back up, then down to rest.
 */
export function legTap(p: number): number {
  const ease = (from: number, to: number, a: number, b: number) => {
    const q = (p - a) / (b - a)
    return from + (to - from) * (0.5 - 0.5 * Math.cos(q * Math.PI))
  }
  if (p <= 0 || p >= 1) return 0
  if (p < 0.35) return ease(0, 1, 0, 0.35)
  if (p < 0.47) return ease(1, 0.12, 0.35, 0.47)
  if (p < 0.62) return ease(0.12, 0.45, 0.47, 0.62)
  return ease(0.45, 0, 0.62, 1)
}

/** 0 → 1 → 0 over p in 0..1. */
export const arc = (p: number) => Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI)
/** A hop: up and down again `count` times over p in 0..1. */
export const hops = (p: number, count: number) => Math.abs(Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI * count))
