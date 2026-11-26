/**
 * The arcade's sounds, made in code with Web Audio (no audio files to load), plus short phone
 * vibrations. One mute switch covers both and is remembered on this device.
 *
 * Browsers only let sound start after a press, so the frame calls `unlockArcadeSound()` from its
 * pointer and key handlers; until then `playArcadeSound` does nothing.
 */

export type ArcadeSound =
  | 'kick'
  | 'jump'
  | 'land'
  | 'bounce'
  | 'spring'
  | 'point'
  | 'milestone'
  | 'best'
  | 'crash'
  | 'crack'
  | 'hit'
  | 'fall'

const MUTE_KEY = 'moltology:arcade:muted'
const MASTER = 0.45

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let muted: boolean | null = null
const listeners = new Set<() => void>()

function readMuted(): boolean {
  if (muted !== null) return muted
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    muted = false
  }
  return muted
}

export function isArcadeMuted(): boolean {
  return typeof window === 'undefined' ? true : readMuted()
}

export function setArcadeMuted(next: boolean) {
  muted = next
  try {
    window.localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    // Storage blocked: the switch lasts for this visit only.
  }
  if (master) master.gain.value = next ? 0 : MASTER
  for (const fn of listeners) fn()
}

/** For useSyncExternalStore. */
export function subscribeArcadeMuted(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Start (or wake) the audio once the player has pressed something. Safe to call on every press. */
export function unlockArcadeSound() {
  if (typeof window === 'undefined') return
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = readMuted() ? 0 : MASTER
      master.connect(ctx.destination)
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

/** A pitched blip: `type` wave sliding from `from` to `to` Hz over `dur` seconds. */
function tone(type: OscillatorType, from: number, to: number, dur: number, gain: number, at = 0) {
  if (!ctx || !master) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** A burst of filtered noise: thuds (lowpass) and cracks (highpass). */
function hiss(filter: BiquadFilterType, freq: number, dur: number, gain: number, at = 0) {
  if (!ctx || !master || !noise) return
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export function playArcadeSound(sound: ArcadeSound) {
  if (!ctx || readMuted() || ctx.state !== 'running') return
  switch (sound) {
    case 'kick':
      // A soft bloop and a little swish of water.
      tone('sine', 280, 520, 0.11, 0.22)
      hiss('bandpass', 900, 0.08, 0.05)
      break
    case 'jump':
      tone('sine', 240, 620, 0.14, 0.2)
      break
    case 'land':
      tone('sine', 150, 70, 0.09, 0.22)
      hiss('lowpass', 500, 0.07, 0.08)
      break
    case 'bounce':
      tone('triangle', 210, 470, 0.13, 0.2)
      tone('sine', 420, 940, 0.1, 0.06, 0.01)
      break
    case 'spring':
      tone('triangle', 180, 980, 0.32, 0.22)
      tone('sine', 360, 1500, 0.28, 0.07, 0.03)
      break
    case 'point':
      tone('sine', 880, 880, 0.1, 0.12)
      tone('sine', 1320, 1320, 0.16, 0.1, 0.07)
      break
    case 'milestone':
      ;[660, 880, 1320].forEach((f, i) => tone('triangle', f, f, 0.16, 0.12, i * 0.08))
      break
    case 'best':
      ;[523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.2, 0.13, i * 0.07))
      break
    case 'crash':
      tone('sine', 130, 45, 0.35, 0.35)
      hiss('lowpass', 900, 0.32, 0.22)
      break
    case 'crack':
      hiss('highpass', 2200, 0.09, 0.16)
      tone('square', 1200, 400, 0.04, 0.04)
      break
    case 'hit':
      tone('sawtooth', 320, 140, 0.16, 0.08)
      hiss('lowpass', 700, 0.12, 0.14)
      break
    case 'fall':
      tone('sine', 640, 110, 0.7, 0.16)
      break
  }
}

/** A short vibration on phones that have one (Android; iOS ignores it). Off while muted. */
export function arcadeBuzz(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || readMuted() || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Some browsers throw when vibration is blocked; nothing to do.
  }
}
