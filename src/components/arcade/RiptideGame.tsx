import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Play, RotateCcw, Shell, Trophy, UserPlus, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HUDSpinner } from '@/components/ui/HUDSpinner'
import { AuthModal } from '@/components/AuthModal'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { mark3DUnavailable } from '@/lib/avatar3d-support'
import { getAssetUrl } from '@/lib/assets'
import { ARCADE_XP_PER_RUN } from '@/lib/arcade'
import { createRiptide, stepRiptide, type RiptideState } from '@/lib/arcade/riptide-sim'
import type { RiptideScene } from '@/lib/arcade/riptide-scene'
import { finishArcadeRunFn, startArcadeRunFn, type ArcadeRunResult } from '@/lib/server/api'
import { authToken } from '@/lib/query/account'
import { usePlayerCharacter } from './usePlayerCharacter'

const STEP = 1 / 120
const GUEST_BEST_KEY = 'moltology:arcade:riptide:best'
/** After a crash, how long before the results show and a tap can start again. */
const RESULTS_DELAY_MS = 700

type Screen = 'loading' | 'ready' | 'playing' | 'paused' | 'over'

function readGuestBest(): number {
  try {
    return Number(window.localStorage.getItem(GUEST_BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function writeGuestBest(score: number) {
  try {
    window.localStorage.setItem(GUEST_BEST_KEY, String(score))
  } catch {
    // Storage blocked: the best lasts for this visit only.
  }
}

const randomSeed = () => Math.floor(Math.random() * 0x7fffffff)

interface Outcome {
  score: number
  best: number
  isBest: boolean
  result: ArcadeRunResult | null
  /** The score could not be saved (network, or the run was not recorded). */
  unsaved: boolean
}

/**
 * Riptide: the player's own character swims a reef current, kicking up through gaps between rock,
 * reef and old pipe. A fixed 3:4 window on every screen, so no one sees further ahead.
 */
export function RiptideGame({ onFinished }: { onFinished?: () => void }) {
  const player = usePlayerCharacter()
  const support = useAvatar3D()
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RiptideScene | null>(null)
  const stateRef = useRef<RiptideState>(createRiptide(randomSeed()))
  const kickRef = useRef(false)
  const screenRef = useRef<Screen>('loading')
  const runRef = useRef<{ runId: string | null; pending: Promise<void> | null }>({ runId: null, pending: null })
  const overAtRef = useRef(0)
  const [screen, setScreenState] = useState<Screen>('loading')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const setScreen = useCallback((next: Screen) => {
    screenRef.current = next
    setScreenState(next)
  }, [])

  const look = useMemo(() => (player.config ? lookFromConfig(player.config) : null), [player.config])
  const signedIn = Boolean(player.userId)

  useEffect(() => {
    if (player.isGuest) setBest(readGuestBest())
  }, [player.isGuest])

  /** Ask the server for the next run (a seed, and a run id for members). */
  const requestTicket = useCallback(() => {
    runRef.current.runId = null
    const pending = (async () => {
      try {
        const ticket = await startArcadeRunFn({ data: { game: 'riptide', token: await authToken() } })
        runRef.current.runId = ticket.runId
        // Use the server's seed if the run has not started yet.
        if (stateRef.current.phase === 'ready') stateRef.current = createRiptide(ticket.seed)
      } catch {
        runRef.current.runId = null
      }
    })()
    runRef.current.pending = pending
  }, [])

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
        observer = new ResizeObserver(() => scene.resize())
        observer.observe(canvas)
        let last = performance.now()
        let carry = 0
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
          let kick = kickRef.current
          kickRef.current = false
          while (carry >= STEP) {
            carry -= STEP
            const events = stepRiptide(state, STEP, kick)
            if (events.kicked) scene.kick()
            if (events.scored) {
              scene.point()
              setScore(state.score)
            }
            if (events.died) {
              scene.crash()
              overAtRef.current = performance.now()
              setScreen('over')
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
    const final = stateRef.current.score
    let cancelled = false
    void (async () => {
      // Let the crash play out before the results cover it.
      await new Promise((resolve) => setTimeout(resolve, RESULTS_DELAY_MS))
      if (cancelled) return
      if (!signedIn) {
        const prior = readGuestBest()
        if (final > prior) writeGuestBest(final)
        setBest(Math.max(prior, final))
        setOutcome({ score: final, best: Math.max(prior, final), isBest: final > prior && final > 0, result: null, unsaved: false })
        return
      }
      await runRef.current.pending
      const runId = runRef.current.runId
      if (!runId) {
        if (!cancelled) setOutcome({ score: final, best: Math.max(best, final), isBest: false, result: null, unsaved: true })
        return
      }
      try {
        const result = await finishArcadeRunFn({ data: { game: 'riptide', runId, score: final, token: await authToken() } })
        if (cancelled) return
        const nextBest = Math.max(result.previousBest, result.saved ? final : 0)
        setBest(nextBest)
        setOutcome({ score: final, best: nextBest, isBest: result.isBest, result, unsaved: !result.saved })
        void queryClient.invalidateQueries({ queryKey: ['arcade', 'riptide'] })
        onFinished?.()
      } catch {
        if (!cancelled) setOutcome({ score: final, best: Math.max(best, final), isBest: false, result: null, unsaved: true })
      }
    })()
    return () => {
      cancelled = true
    }
    // Only when a run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  const restart = useCallback(() => {
    stateRef.current = createRiptide(randomSeed())
    setScore(0)
    setOutcome(null)
    requestTicket()
    setScreen('ready')
  }, [requestTicket, setScreen])

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
      const target = event.target as HTMLElement | null
      if (target && (target.closest('input, textarea, [contenteditable="true"]') || (target.closest('button, a') && event.key === 'Enter'))) return
      if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W' || event.key === 'Enter') {
        event.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  // Leaving the tab pauses a run in progress.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && screenRef.current === 'playing') setScreen('paused')
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [setScreen])

  const showResults = screen === 'over' && outcome
  const xp = outcome?.result?.xp ?? 0

  // The game owns the whole screen: nothing else scrolls or sits on top of it while it is open.
  useEffect(() => {
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = before
    }
  }, [])

  const game = (
    <div
      className="fixed inset-0 z-[100050] overflow-hidden bg-abyss font-sans text-ink select-none touch-none overscroll-none"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('button, a, [role="dialog"]')) return
        event.preventDefault()
        press()
      }}
      data-testid="riptide-game"
      data-screen={screen}
    >
      {support !== false && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Riptide game" />}

      {/* On a wide screen the field is a 3:4 column in the middle (so no one sees further ahead);
          the reef either side of it is dimmed. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-100dvh*0.75)/2))] bg-gradient-to-r from-abyss/85 to-abyss/55" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-100dvh*0.75)/2))] bg-gradient-to-l from-abyss/85 to-abyss/55" />

      {support === false && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-muted">
          This game needs 3D graphics, which this browser has turned off.
        </div>
      )}

      {screen === 'loading' && support !== false && (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss">
          <HUDSpinner />
        </div>
      )}

      {/* Top bar: best on the left, the score in the middle, close on the right. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="mt-1.5 rounded-full bg-abyss/60 px-2.5 py-1 text-xs text-ink-body tabular-nums">Best {best}</span>
        {screen !== 'loading' && (
          <span className="rounded-full bg-abyss/60 px-4 py-1 font-grotesk text-2xl font-semibold text-ink tabular-nums" aria-live="polite">
            {score}
          </span>
        )}
        <Link
          to="/arcade"
          aria-label="Close game"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-abyss/60 text-ink-body hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {screen === 'ready' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(18%,calc(env(safe-area-inset-bottom)+6rem))] flex flex-col items-center gap-1.5 px-4 text-center">
          <p className="font-grotesk text-2xl font-semibold tracking-tight text-ink">Riptide</p>
          <span className="rounded-full bg-abyss/70 px-4 py-2 text-sm font-medium text-ink">Tap to swim</span>
          <span className="rounded-full bg-abyss/60 px-3 py-1 text-xs text-ink-body">Space or click works too. Touch anything and the run ends.</span>
          {player.standIn && (
            <Link
              to="/character"
              className="pointer-events-auto mt-2 inline-flex items-center gap-1.5 rounded-full bg-abyss/70 px-3 py-1.5 text-xs text-cyan-glow hover:text-cyan-hover"
            >
              <Shell className="w-3.5 h-3.5" aria-hidden="true" />
              Make your own character first
            </Link>
          )}
        </div>
      )}

      {screen === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-abyss/50">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-ink">
            <Play className="w-4 h-4" aria-hidden="true" /> Paused. Tap to carry on
          </span>
        </div>
      )}

      {showResults && (
        <div className="absolute inset-0 flex items-end sm:items-center justify-center bg-abyss/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
          <div
            role="dialog"
            aria-label="Run over"
            className="w-full max-w-xs rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5 text-center shadow-menu"
          >
            <p className="eyebrow">Run over</p>
            <p className="mt-1 font-grotesk text-2xl font-semibold text-ink tabular-nums">{outcome.score}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {outcome.isBest ? <span className="text-emerald-500">New best</span> : <>Best {outcome.best}</>}
              {outcome.result?.weekRank ? <> · #{outcome.result.weekRank} this week</> : null}
            </p>
            {signedIn && (
              <p className="mt-2 text-xs text-ink-muted">
                {outcome.unsaved
                  ? 'This score could not be saved.'
                  : xp > 0
                    ? `+${xp} XP`
                    : outcome.result && outcome.result.xpRunsLeft === 0
                      ? "You've earned today's arcade XP."
                      : `Score 3 or more to earn ${ARCADE_XP_PER_RUN} XP.`}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <HudButton type="button" variant="primary" fullWidth onClick={restart} icon={<RotateCcw className="w-4 h-4" />}>
                Play again
              </HudButton>
              {!signedIn ? (
                <HudButton type="button" variant="secondary" fullWidth onClick={() => setAuthOpen(true)} icon={<UserPlus className="w-4 h-4" />}>
                  Sign up to save scores
                </HudButton>
              ) : (
                <Link
                  to="/arcade"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line-subtle bg-surface-2 px-4 text-ui font-medium text-ink hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <Trophy className="w-4 h-4" aria-hidden="true" />
                  Leaderboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {!signedIn && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />}
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(game, document.body)
}

export default RiptideGame
