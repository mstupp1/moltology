import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { getAssetUrl } from '@/lib/assets'
import { createRiptide, stepRiptide, type RiptideState } from '@/lib/arcade/riptide-sim'
import type { RiptideScene } from '@/lib/arcade/riptide-scene'
import { arcadeBuzz, playArcadeSound } from '@/lib/arcade/sound'
import { ArcadeFrame, HIT_STOP_MS, RESULTS_DELAY_MS, keyBelongsToPage, randomSeed, useArcadeRuns, usePauseWhenHidden, type ArcadeScreen } from './ArcadeShell'
import { usePlayerCharacter } from './usePlayerCharacter'

const STEP = 1 / 120

type Screen = ArcadeScreen

/**
 * Riptide: the player's own character swims a reef current, kicking up through gaps between rock,
 * reef and old pipe. A fixed 3:4 window on every screen, so no one sees further ahead.
 */
export function RiptideGame({ onFinished }: { onFinished?: () => void }) {
  const player = usePlayerCharacter()
  const support = useAvatar3D()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RiptideScene | null>(null)
  const stateRef = useRef<RiptideState>(createRiptide(randomSeed()))
  const kickRef = useRef(false)
  const screenRef = useRef<Screen>('loading')
  const overAtRef = useRef(0)
  const [screen, setScreenState] = useState<Screen>('loading')
  const [score, setScore] = useState(0)
  const [crashPulse, setCrashPulse] = useState(0)
  const [bestPulse, setBestPulse] = useState(0)
  const bestRef = useRef(0)
  const beatBestRef = useRef(false)
  const setScreen = useCallback((next: Screen) => {
    screenRef.current = next
    setScreenState(next)
  }, [])

  const look = useMemo(() => (player.config ? lookFromConfig(player.config) : null), [player.config])
  const signedIn = Boolean(player.userId)
  const { best, outcome, setOutcome, requestTicket, finish } = useArcadeRuns('riptide', {
    signedIn,
    isGuest: player.isGuest,
    onFinished,
    // Use the server's seed if the run has not started yet.
    onSeed: (seed) => {
      if (stateRef.current.phase === 'ready') stateRef.current = createRiptide(seed)
    },
  })

  useEffect(() => {
    bestRef.current = best
    sceneRef.current?.setBest(best)
  }, [best])

  // The scene: built once 3D is known to work, rebuilt only if the page remounts.
  useEffect(() => {
    if (!support) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let raf = 0
    let observer: ResizeObserver | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const quality = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high'
    void import('@/lib/arcade/riptide-scene')
      .then(({ createRiptideScene }) => {
        if (cancelled) return
        const scene = createRiptideScene(canvas, {
          quality,
          reducedMotion,
          onContextLost: mark3DUnavailable,
          art: {
            backdrop: getAssetUrl('images/arcade/v1/riptide-backdrop.jpg'),
            rock: getAssetUrl('textures/arcade/v1/rock.webp'),
            sand: getAssetUrl('textures/arcade/v1/sand.webp'),
            rust: getAssetUrl('textures/arcade/v1/rust.webp'),
          },
        })
        sceneRef.current = scene
        scene.setBest(bestRef.current)
        observer = new ResizeObserver(() => scene.resize())
        observer.observe(canvas)
        let last = performance.now()
        let carry = 0
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
          let kick = kickRef.current
          kickRef.current = false
          while (carry >= STEP) {
            carry -= STEP
            const events = stepRiptide(state, STEP, kick)
            if (events.kicked) {
              scene.kick()
              playArcadeSound('kick')
            }
            if (events.scored) {
              scene.point()
              setScore(state.score)
              if (!beatBestRef.current && bestRef.current > 0 && state.score > bestRef.current) {
                beatBestRef.current = true
                setBestPulse((n) => n + 1)
                playArcadeSound('best')
              } else playArcadeSound(state.score % 10 === 0 ? 'milestone' : 'point')
            }
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
            if (kick && state.phase === 'playing' && screenRef.current === 'ready') setScreen('playing')
            kick = false
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

  // Put the player's character in the water once both it and the scene are ready.
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

  // A finished run: save it (members), keep the best, show the results.
  useEffect(() => {
    if (screen !== 'over') return
    let cancelled = false
    void finish(stateRef.current.score, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [screen, finish])

  const restart = useCallback(() => {
    stateRef.current = createRiptide(randomSeed())
    beatBestRef.current = false
    setScore(0)
    setOutcome(null)
    requestTicket()
    setScreen('ready')
  }, [requestTicket, setScreen, setOutcome])

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
    kickRef.current = true
  }, [restart, setScreen])

  // Space, up arrow, W or Enter kick; the page does not scroll while playing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (keyBelongsToPage(event)) return
      if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W' || event.key === 'Enter') {
        event.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  // Local dev only: the live state, for screenshot scripts to set up a scene.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __arcadeState?: unknown }).__arcadeState = stateRef
  }, [])

  // Leaving the tab pauses a run in progress.
  usePauseWhenHidden(screenRef, setScreen)

  return (
    <ArcadeFrame
      game="riptide"
      screen={screen}
      score={score}
      best={best}
      outcome={outcome}
      signedIn={signedIn}
      standIn={player.standIn}
      support={support}
      canvasRef={canvasRef}
      onRestart={restart}
      readyAction="Tap to swim"
      readyHint="Space or click works too. Touch anything and the run ends."
      onPointerDown={press}
      crashPulse={crashPulse}
      bestPulse={bestPulse}
      onPause={() => setScreen('paused')}
    >
      {/* On a wide screen the field is a 3:4 column in the middle (so no one sees further ahead);
          the reef either side of it is dimmed. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-100dvh*0.75)/2))] bg-gradient-to-r from-abyss/85 to-abyss/55" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-100dvh*0.75)/2))] bg-gradient-to-l from-abyss/85 to-abyss/55" />
    </ArcadeFrame>
  )
}

export default RiptideGame
