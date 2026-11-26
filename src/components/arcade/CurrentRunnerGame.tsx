import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { getAssetUrl } from '@/lib/assets'
import { createRunner, stepRunner, type RunnerState } from '@/lib/arcade/current-runner-sim'
import type { RunnerScene } from '@/lib/arcade/current-runner-scene'
import { ChevronsDown } from 'lucide-react'
import { arcadeBuzz, playArcadeSound } from '@/lib/arcade/sound'
import { ArcadeFrame, HIT_STOP_MS, RESULTS_DELAY_MS, keyBelongsToPage, randomSeed, useArcadeRuns, usePauseWhenHidden, type ArcadeScreen } from './ArcadeShell'
import { usePlayerCharacter } from './usePlayerCharacter'

const STEP = 1 / 120
/** A downward swipe this far (CSS pixels) ducks. */
const SWIPE_PX = 28
/** On touch screens, holding this share of the screen on the left ducks (and dives in the air). */
const DUCK_ZONE = 0.38

const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W', 'Enter'])
const DUCK_KEYS = new Set(['ArrowDown', 's', 'S'])

/**
 * Current Runner: the player's own character runs the seafloor as the current speeds up, jumping
 * urchins and coral and ducking jellyfish. The field is a fixed 16:9 window, so everyone sees the
 * same distance ahead.
 */
export function CurrentRunnerGame({ onFinished }: { onFinished?: () => void }) {
  const player = usePlayerCharacter()
  const support = useAvatar3D()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RunnerScene | null>(null)
  const stateRef = useRef<RunnerState>(createRunner(randomSeed()))
  const input = useRef({ jump: false, jumpHeld: false, keyDown: false, swipeDown: false, zoneDown: false })
  const pointer = useRef<{ id: number; y: number; swiped: boolean } | null>(null)
  const duckPointer = useRef<number | null>(null)
  const screenRef = useRef<ArcadeScreen>('loading')
  const overAtRef = useRef(0)
  const [screen, setScreenState] = useState<ArcadeScreen>('loading')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(0)
  const [portrait, setPortrait] = useState(false)
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
  const { best, outcome, setOutcome, requestTicket, finish } = useArcadeRuns('current-runner', {
    signedIn,
    isGuest: player.isGuest,
    onFinished,
    onSeed: (seed) => {
      if (stateRef.current.phase === 'ready') stateRef.current = createRunner(seed)
    },
  })

  useEffect(() => {
    bestRef.current = best
    sceneRef.current?.setBest(best)
  }, [best])

  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])

  useEffect(() => {
    const check = () => setPortrait(window.innerWidth / window.innerHeight < 0.8)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
    void import('@/lib/arcade/current-runner-scene')
      .then(({ createRunnerScene }) => {
        if (cancelled) return
        const scene = createRunnerScene(canvas, {
          quality,
          reducedMotion,
          onContextLost: mark3DUnavailable,
          art: {
            backdrop: getAssetUrl('images/arcade/v1/current-runner-backdrop.jpg'),
            sand: getAssetUrl('textures/arcade/v1/runner-sand.webp'),
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
        let freezeUntil = 0
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick)
          const dt = Math.min(0.1, (now - last) / 1000)
          last = now
          const state = stateRef.current
          const current = screenRef.current
          // Paused, loading, or the beat of stillness right after a crash.
          if (current === 'paused' || current === 'loading' || now < freezeUntil) {
            carry = 0
            scene.draw(state, 0, now / 1000)
            return
          }
          carry += dt
          const i = input.current
          let jump = i.jump
          i.jump = false
          while (carry >= STEP) {
            carry -= STEP
            const events = stepRunner(state, STEP, { jump, jumpHeld: i.jumpHeld, down: i.keyDown || i.swipeDown || i.zoneDown })
            if (events.jumped) {
              scene.jump()
              playArcadeSound('jump')
            }
            if (events.landed) {
              scene.land()
              playArcadeSound('land')
            }
            if (!beatBestRef.current && bestRef.current > 0 && state.score > bestRef.current) {
              beatBestRef.current = true
              setBestPulse((n) => n + 1)
              playArcadeSound('best')
            } else if (events.milestone) playArcadeSound('milestone')
            if (events.milestone) setFlash((n) => n + 1)
            if (events.died) {
              scene.crash()
              playArcadeSound('crash')
              arcadeBuzz([30, 40, 60])
              setCrashPulse((n) => n + 1)
              freezeUntil = now + HIT_STOP_MS
              carry = 0
              overAtRef.current = performance.now()
              setScreen('over')
              break
            }
            if (jump && state.phase === 'playing' && screenRef.current === 'ready') setScreen('playing')
            jump = false
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
  }, [support, setScreen])

  // Put the player's character on the sand once both it and the scene are ready.
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

  const restart = useCallback(() => {
    stateRef.current = createRunner(randomSeed())
    beatBestRef.current = false
    sceneRef.current?.reset()
    setScore(0)
    setOutcome(null)
    requestTicket()
    setScreen('ready')
  }, [requestTicket, setScreen, setOutcome])

  /** A jump press (tap, click, key). Also starts, resumes and restarts. */
  const pressJump = useCallback(() => {
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
    input.current.jump = true
    input.current.jumpHeld = true
  }, [restart, setScreen])

  // Keys: space, up, W or Enter jump (hold for higher); down or S ducks, or dives in the air.
  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      if (keyBelongsToPage(event)) return
      if (JUMP_KEYS.has(event.key)) {
        event.preventDefault()
        if (!event.repeat) pressJump()
      } else if (DUCK_KEYS.has(event.key)) {
        event.preventDefault()
        input.current.keyDown = true
      }
    }
    const onUp = (event: KeyboardEvent) => {
      if (JUMP_KEYS.has(event.key)) input.current.jumpHeld = false
      if (DUCK_KEYS.has(event.key)) input.current.keyDown = false
    }
    const onBlur = () => {
      input.current.jumpHeld = false
      input.current.keyDown = false
      input.current.swipeDown = false
      input.current.zoneDown = false
      duckPointer.current = null
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [pressJump])

  usePauseWhenHidden(screenRef, setScreen)

  // Local dev only: the live state, for screenshot scripts to set up a scene.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __arcadeState?: unknown }).__arcadeState = stateRef
  }, [])

  // Touch and mouse: a tap jumps (held, higher). On a touch screen, holding the left part of the
  // screen ducks (or dives in the air) without jumping first; a swipe down anywhere still ducks.
  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== 'mouse' && screenRef.current === 'playing' && event.clientX < window.innerWidth * DUCK_ZONE) {
        duckPointer.current = event.pointerId
        input.current.zoneDown = true
        return
      }
      // A runner needs the jump at once, so a press jumps; a swipe down after it cancels the hold
      // (a short hop, or a dive if already up) and ducks.
      pointer.current = { id: event.pointerId, y: event.clientY, swiped: false }
      pressJump()
    },
    [pressJump],
  )
  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const p = pointer.current
    if (!p || p.id !== event.pointerId) return
    if (!p.swiped && event.clientY - p.y > SWIPE_PX) {
      p.swiped = true
      input.current.jumpHeld = false
      input.current.swipeDown = true
    }
  }, [])
  const onPointerUp = useCallback((event: React.PointerEvent) => {
    if (duckPointer.current === event.pointerId) {
      duckPointer.current = null
      input.current.zoneDown = false
      return
    }
    if (pointer.current?.id !== event.pointerId) return
    pointer.current = null
    input.current.jumpHeld = false
    input.current.swipeDown = false
  }, [])

  return (
    <ArcadeFrame
      game="current-runner"
      screen={screen}
      score={score}
      best={best}
      outcome={outcome}
      signedIn={signedIn}
      standIn={player.standIn}
      support={support}
      canvasRef={canvasRef}
      onRestart={restart}
      readyAction="Tap to run"
      readyAt="high"
      resultsAt="high"
      readyHint={
        touch
          ? `Tap the right side to jump, hold for higher. Hold the left side to duck.${portrait ? ' Turn your phone sideways for a bigger view.' : ''}`
          : 'Space or click to jump, hold for higher. Down arrow to duck.'
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      scorePulse={flash}
      crashPulse={crashPulse}
      bestPulse={bestPulse}
      onPause={() => setScreen('paused')}
    >
      {/* On touch screens: where to hold to duck, and where to tap to jump. */}
      {touch && (screen === 'ready' || screen === 'playing') && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-abyss/45 px-3 py-2 text-xs font-medium text-ink-body">
            <ChevronsDown className="h-4 w-4" />
            Hold to duck
          </span>
          <span className="inline-flex items-center rounded-full border border-line-subtle bg-abyss/45 px-3 py-2 text-xs font-medium text-ink-body">Tap to jump</span>
        </div>
      )}
      {/* On a screen wider than 16:9 the field is a band in the middle; what lies past it is dimmed. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-100dvh*1.7778)/2))] bg-gradient-to-r from-abyss/85 to-abyss/55" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-100dvh*1.7778)/2))] bg-gradient-to-l from-abyss/85 to-abyss/55" />
    </ArcadeFrame>
  )
}

export default CurrentRunnerGame
