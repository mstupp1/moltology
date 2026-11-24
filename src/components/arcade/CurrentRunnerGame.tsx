import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { getAssetUrl } from '@/lib/assets'
import { createRunner, stepRunner, type RunnerState } from '@/lib/arcade/current-runner-sim'
import type { RunnerScene } from '@/lib/arcade/current-runner-scene'
import { ArcadeFrame, RESULTS_DELAY_MS, keyBelongsToPage, randomSeed, useArcadeRuns, usePauseWhenHidden, type ArcadeScreen } from './ArcadeShell'
import { usePlayerCharacter } from './usePlayerCharacter'

const STEP = 1 / 120
/** A downward swipe this far (CSS pixels) ducks. */
const SWIPE_PX = 28

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
  const input = useRef({ jump: false, jumpHeld: false, keyDown: false, swipeDown: false })
  const pointer = useRef<{ id: number; y: number; swiped: boolean } | null>(null)
  const screenRef = useRef<ArcadeScreen>('loading')
  const overAtRef = useRef(0)
  const [screen, setScreenState] = useState<ArcadeScreen>('loading')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(0)
  const [portrait, setPortrait] = useState(false)
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
          const i = input.current
          let jump = i.jump
          i.jump = false
          while (carry >= STEP) {
            carry -= STEP
            const events = stepRunner(state, STEP, { jump, jumpHeld: i.jumpHeld, down: i.keyDown || i.swipeDown })
            if (events.jumped) scene.jump()
            if (events.landed) scene.land()
            if (events.milestone) setFlash((n) => n + 1)
            if (events.died) {
              scene.crash()
              overAtRef.current = performance.now()
              setScreen('over')
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

  // Touch and mouse: a tap jumps (held, higher); a swipe down ducks for as long as the finger stays down.
  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
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
      readyHint={portrait ? 'Tap to jump, swipe down to duck. Turn your phone sideways for a bigger view.' : 'Space or click to jump, hold for higher. Down arrow to duck.'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      scorePulse={flash}
    >
      {/* On a screen wider than 16:9 the field is a band in the middle; what lies past it is dimmed. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-100dvh*1.7778)/2))] bg-gradient-to-r from-abyss/85 to-abyss/55" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-100dvh*1.7778)/2))] bg-gradient-to-l from-abyss/85 to-abyss/55" />
    </ArcadeFrame>
  )
}

export default CurrentRunnerGame
