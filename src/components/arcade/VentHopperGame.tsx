import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { getAssetUrl } from '@/lib/assets'
import { createHopper, stepHopper, type HopperState } from '@/lib/arcade/vent-hopper-sim'
import type { HopperScene } from '@/lib/arcade/vent-hopper-scene'
import { arcadeBuzz, playArcadeSound } from '@/lib/arcade/sound'
import { ArcadeFrame, RESULTS_DELAY_MS, keyBelongsToPage, randomSeed, useArcadeRuns, usePauseWhenHidden, type ArcadeScreen } from './ArcadeShell'
import { usePlayerCharacter } from './usePlayerCharacter'

const STEP = 1 / 120
/** Degrees of tilt for full steer, and the dead zone around level. */
const TILT_FULL = 18
const TILT_DEAD = 2
/** The way the phone is held when a run starts counts as level, up to this many degrees. */
const TILT_ZERO_MAX = 12

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A'])
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D'])
const START_KEYS = new Set([' ', 'Enter', 'ArrowUp', 'w', 'W'])

type OrientationPermission = {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/** Left-right tilt of the device in degrees, whichever way up the screen is. */
function sideTilt(event: DeviceOrientationEvent): number | null {
  if (event.gamma === null || event.beta === null) return null
  const angle = screen.orientation?.angle ?? 0
  if (angle === 90) return event.beta
  if (angle === 270 || angle === -90) return -event.beta
  if (angle === 180) return -event.gamma
  return event.gamma
}

/**
 * Vent Hopper: the player's own character bounces up a vent shaft from pad to pad, steering left
 * and right (tilt, holding a side of the screen, or the arrow keys). The field is a fixed 9:16
 * window, so everyone sees the same distance up.
 */
export function VentHopperGame({ onFinished }: { onFinished?: () => void }) {
  const player = usePlayerCharacter()
  const support = useAvatar3D()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<HopperScene | null>(null)
  const stateRef = useRef<HopperState>(createHopper(randomSeed()))
  const input = useRef({ start: false, left: false, right: false })
  const pointers = useRef(new Map<number, -1 | 1>())
  const tilt = useRef({ on: false, raw: 0, zero: 0, asked: false })
  const screenRef = useRef<ArcadeScreen>('loading')
  const overAtRef = useRef(0)
  const [screen, setScreenState] = useState<ArcadeScreen>('loading')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(0)
  const [touch, setTouch] = useState(false)
  const [crashPulse, setCrashPulse] = useState(0)
  const [bestPulse, setBestPulse] = useState(0)
  const bestRef = useRef(0)
  const beatBestRef = useRef(false)
  const setScreen = useCallback((next: ArcadeScreen) => {
    screenRef.current = next
    setScreenState(next)
  }, [])

  const look = useMemo(() => (player.config ? lookFromConfig(player.config) : null), [player.config])
  const signedIn = Boolean(player.userId)
  const { best, outcome, setOutcome, requestTicket, finish } = useArcadeRuns('vent-hopper', {
    signedIn,
    isGuest: player.isGuest,
    onFinished,
    onSeed: (seed) => {
      if (stateRef.current.phase === 'ready') stateRef.current = createHopper(seed)
    },
  })

  const [sideways, setSideways] = useState(false)
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
    const check = () => setSideways(window.innerWidth / window.innerHeight > 1.2)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /** The steer this moment: a held side of the screen first, then keys, then tilt. */
  const steer = useCallback(() => {
    let side = 0
    for (const s of pointers.current.values()) side = s
    if (side) return side
    const i = input.current
    if (i.left !== i.right) return i.left ? -1 : 1
    if (!tilt.current.on) return 0
    const t = tilt.current.raw - tilt.current.zero
    const live = Math.abs(t) < TILT_DEAD ? 0 : (t - Math.sign(t) * TILT_DEAD) / (TILT_FULL - TILT_DEAD)
    return Math.max(-1, Math.min(1, live))
  }, [])

  useEffect(() => {
    bestRef.current = best
    sceneRef.current?.setBest(best)
  }, [best])

  // The scene and the game loop.
  useEffect(() => {
    if (!support) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let raf = 0
    let observer: ResizeObserver | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const quality = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high'
    void import('@/lib/arcade/vent-hopper-scene')
      .then(({ createHopperScene }) => {
        if (cancelled) return
        const scene = createHopperScene(canvas, {
          quality,
          reducedMotion,
          onContextLost: mark3DUnavailable,
          art: {
            backdrop: getAssetUrl('images/arcade/v1/vent-hopper-backdrop.jpg'),
            sponge: getAssetUrl('textures/arcade/v1/sponge.webp'),
            coral: getAssetUrl('textures/arcade/v1/plate-coral.webp'),
            rock: getAssetUrl('textures/arcade/v1/rock.webp'),
          },
        })
        sceneRef.current = scene
        scene.setBest(bestRef.current)
        observer = new ResizeObserver(() => scene.resize())
        observer.observe(canvas)
        let last = performance.now()
        let carry = 0
        let shownScore = 0
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick)
          const dt = Math.min(0.1, (now - last) / 1000)
          last = now
          const state = stateRef.current
          const current = screenRef.current
          if (current === 'paused' || current === 'loading') {
            scene.draw(state, 0, now / 1000)
            return
          }
          carry += dt
          let start = input.current.start
          input.current.start = false
          while (carry >= STEP) {
            carry -= STEP
            const events = stepHopper(state, STEP, { start, steer: steer() })
            if (events.bounced) {
              scene.bounce(events.bounced, state.lastPad)
              playArcadeSound(events.bounced === 'clam' ? 'spring' : 'bounce')
              if (events.bounced === 'clam') arcadeBuzz(15)
            }
            if (events.broke) {
              scene.crack()
              playArcadeSound('crack')
            }
            if (events.hit) {
              scene.hit()
              playArcadeSound('hit')
              arcadeBuzz(40)
              setCrashPulse((n) => n + 1)
            }
            if (!beatBestRef.current && bestRef.current > 0 && state.score > bestRef.current) {
              beatBestRef.current = true
              setBestPulse((n) => n + 1)
              playArcadeSound('best')
            } else if (events.milestone) playArcadeSound('milestone')
            if (events.milestone) setFlash((n) => n + 1)
            if (events.died) {
              scene.fall()
              playArcadeSound('fall')
              arcadeBuzz([20, 30, 50])
              overAtRef.current = performance.now()
              setScreen('over')
            }
            if (start && state.phase === 'playing' && screenRef.current === 'ready') setScreen('playing')
            start = false
          }
          if (state.score !== shownScore) {
            shownScore = state.score
            setScore(state.score)
          }
          scene.draw(state, dt, now / 1000)
        }
        raf = requestAnimationFrame(tick)
      })
      .catch(() => mark3DUnavailable())
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer?.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [support, setScreen, steer])

  // Put the player's character on the vent floor once both it and the scene are ready.
  useEffect(() => {
    if (!look) return
    let cancelled = false
    const place = () => {
      if (cancelled) return
      const scene = sceneRef.current
      if (!scene) {
        requestAnimationFrame(place)
        return
      }
      scene.setLook(look)
      if (screenRef.current === 'loading') {
        requestTicket()
        setScreen('ready')
      }
    }
    place()
    return () => {
      cancelled = true
    }
  }, [look, requestTicket, setScreen])

  useEffect(() => {
    if (screen !== 'over') return
    let cancelled = false
    void finish(stateRef.current.score, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [screen, finish])

  // Tilt steering on phones and tablets. iOS asks permission, and only from a tap.
  useEffect(() => {
    const onOrient = (event: DeviceOrientationEvent) => {
      const t = sideTilt(event)
      if (t === null) return
      tilt.current.on = true
      tilt.current.raw = t
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [])
  const askForTilt = useCallback(() => {
    if (tilt.current.asked || !window.matchMedia('(pointer: coarse)').matches) return
    tilt.current.asked = true
    const ask = (window.DeviceOrientationEvent as unknown as OrientationPermission | undefined)?.requestPermission
    // Refused or unavailable: holding a side of the screen still steers.
    if (ask) void ask().catch(() => undefined)
  }, [])

  const restart = useCallback(() => {
    stateRef.current = createHopper(randomSeed())
    beatBestRef.current = false
    sceneRef.current?.reset()
    setScore(0)
    setOutcome(null)
    requestTicket()
    setScreen('ready')
  }, [requestTicket, setScreen, setOutcome])

  /** A press (tap, click, key): starts, resumes and restarts. */
  const press = useCallback(() => {
    const current = screenRef.current
    if (current === 'loading') return
    if (current === 'paused') {
      setScreen('playing')
      return
    }
    if (current === 'over') {
      if (performance.now() - overAtRef.current > RESULTS_DELAY_MS * 1.5) restart()
      return
    }
    if (current === 'ready') {
      input.current.start = true
      // However the phone is held now counts as level for this run.
      tilt.current.zero = Math.max(-TILT_ZERO_MAX, Math.min(TILT_ZERO_MAX, tilt.current.raw))
    }
  }, [restart, setScreen])

  // Keys: left/right or A/D steer; space, Enter or up start.
  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      if (keyBelongsToPage(event)) return
      if (LEFT_KEYS.has(event.key) || RIGHT_KEYS.has(event.key)) {
        event.preventDefault()
        if (LEFT_KEYS.has(event.key)) input.current.left = true
        else input.current.right = true
        if (!event.repeat && screenRef.current === 'ready') press()
      } else if (START_KEYS.has(event.key)) {
        event.preventDefault()
        if (!event.repeat) press()
      }
    }
    const onUp = (event: KeyboardEvent) => {
      if (LEFT_KEYS.has(event.key)) input.current.left = false
      if (RIGHT_KEYS.has(event.key)) input.current.right = false
    }
    const onBlur = () => {
      input.current.left = false
      input.current.right = false
      pointers.current.clear()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [press])

  usePauseWhenHidden(screenRef, setScreen)

  // Local dev only: the live state, for screenshot scripts to set up a scene.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __arcadeState?: unknown }).__arcadeState = stateRef
  }, [])

  // Touch and mouse: a press starts the run; holding the left or right half steers that way.
  const sideOf = (event: React.PointerEvent): -1 | 1 => (event.clientX < window.innerWidth / 2 ? -1 : 1)
  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      askForTilt()
      const wasPlaying = screenRef.current === 'playing'
      press()
      if (wasPlaying || screenRef.current === 'ready') pointers.current.set(event.pointerId, sideOf(event))
    },
    [askForTilt, press],
  )
  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, sideOf(event))
  }, [])
  const onPointerUp = useCallback((event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)
  }, [])

  return (
    <ArcadeFrame
      game="vent-hopper"
      screen={screen}
      score={score}
      best={best}
      outcome={outcome}
      signedIn={signedIn}
      standIn={player.standIn}
      support={support}
      canvasRef={canvasRef}
      onRestart={restart}
      readyAction={touch ? 'Tap to hop' : 'Press space to hop'}
      readyAt="high"
      readyHint={
        touch
          ? `Tilt your phone to steer, or hold either side of the screen.${sideways ? ' Hold your phone upright for a bigger view.' : ''}`
          : 'Left and right arrows (or A and D) to steer. Click and hold a side works too.'
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      scorePulse={flash}
      crashPulse={crashPulse}
      bestPulse={bestPulse}
      onPause={() => setScreen('paused')}
    >
      {/* On a screen wider than 9:16 the field is a column in the middle; what lies either side is dimmed. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-100dvh*0.5625)/2))] bg-gradient-to-r from-abyss/85 to-abyss/55" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-100dvh*0.5625)/2))] bg-gradient-to-l from-abyss/85 to-abyss/55" />
    </ArcadeFrame>
  )
}

export default VentHopperGame
