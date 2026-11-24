import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Play, RotateCcw, Shell, Trophy, UserPlus, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HUDSpinner } from '@/components/ui/HUDSpinner'
import { AuthModal } from '@/components/AuthModal'
import { ARCADE_GAMES, ARCADE_XP_PER_RUN, type ArcadeGameId } from '@/lib/arcade'
import { finishArcadeRunFn, startArcadeRunFn, type ArcadeRunResult } from '@/lib/server/api'
import { authToken } from '@/lib/query/account'
import { cn } from '@/lib/utils'

/**
 * What every arcade game shares: asking the server for a run, saving the score (members) or the
 * guest's best (this browser), and the full-screen frame with the score, close X, pause and
 * results card. A game brings its own canvas, sim and controls (see RiptideGame, CurrentRunnerGame).
 */

export type ArcadeScreen = 'loading' | 'ready' | 'playing' | 'paused' | 'over'

/** After a crash, how long before the results show and a tap can start again. */
export const RESULTS_DELAY_MS = 700

export interface ArcadeOutcome {
  score: number
  best: number
  isBest: boolean
  result: ArcadeRunResult | null
  /** The score could not be saved (network, or the run was not recorded). */
  unsaved: boolean
}

export const randomSeed = () => Math.floor(Math.random() * 0x7fffffff)

const guestBestKey = (game: ArcadeGameId) => `moltology:arcade:${game}:best`

function readGuestBest(game: ArcadeGameId): number {
  try {
    return Number(window.localStorage.getItem(guestBestKey(game))) || 0
  } catch {
    return 0
  }
}

function writeGuestBest(game: ArcadeGameId, score: number) {
  try {
    window.localStorage.setItem(guestBestKey(game), String(score))
  } catch {
    // Storage blocked: the best lasts for this visit only.
  }
}

/**
 * A game's runs: `requestTicket` before each run (the seed arrives through `onSeed` if the run has
 * not started yet), `finish` once it ends. Guests keep their best in this browser.
 */
export function useArcadeRuns(game: ArcadeGameId, opts: { signedIn: boolean; isGuest: boolean; onSeed: (seed: number) => void; onFinished?: () => void }) {
  const queryClient = useQueryClient()
  const runRef = useRef<{ runId: string | null; pending: Promise<void> | null }>({ runId: null, pending: null })
  const [best, setBest] = useState(0)
  const [outcome, setOutcome] = useState<ArcadeOutcome | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const bestRef = useRef(0)
  bestRef.current = best

  useEffect(() => {
    if (opts.isGuest) setBest(readGuestBest(game))
  }, [opts.isGuest, game])

  const requestTicket = useCallback(() => {
    runRef.current.runId = null
    runRef.current.pending = (async () => {
      try {
        const ticket = await startArcadeRunFn({ data: { game, token: await authToken() } })
        runRef.current.runId = ticket.runId
        optsRef.current.onSeed(ticket.seed)
      } catch {
        runRef.current.runId = null
      }
    })()
  }, [game])

  /** Save a finished run and show its results. Resolves early (and quietly) if `isCancelled()` turns true. */
  const finish = useCallback(
    async (final: number, isCancelled: () => boolean) => {
      // Let the crash play out before the results cover it.
      await new Promise((resolve) => setTimeout(resolve, RESULTS_DELAY_MS))
      if (isCancelled()) return
      const prevBest = bestRef.current
      if (!optsRef.current.signedIn) {
        const prior = readGuestBest(game)
        if (final > prior) writeGuestBest(game, final)
        setBest(Math.max(prior, final))
        setOutcome({ score: final, best: Math.max(prior, final), isBest: final > prior && final > 0, result: null, unsaved: false })
        return
      }
      await runRef.current.pending
      const runId = runRef.current.runId
      if (!runId) {
        if (!isCancelled()) setOutcome({ score: final, best: Math.max(prevBest, final), isBest: false, result: null, unsaved: true })
        return
      }
      try {
        const result = await finishArcadeRunFn({ data: { game, runId, score: final, token: await authToken() } })
        if (isCancelled()) return
        const nextBest = Math.max(result.previousBest, result.saved ? final : 0)
        setBest(nextBest)
        setOutcome({ score: final, best: nextBest, isBest: result.isBest, result, unsaved: !result.saved })
        void queryClient.invalidateQueries({ queryKey: ['arcade', game] })
        optsRef.current.onFinished?.()
      } catch {
        if (!isCancelled()) setOutcome({ score: final, best: Math.max(prevBest, final), isBest: false, result: null, unsaved: true })
      }
    },
    [game, queryClient],
  )

  return { best, outcome, setOutcome, requestTicket, finish }
}

/** Pause a run in progress when the tab is hidden. */
export function usePauseWhenHidden(screenRef: React.MutableRefObject<ArcadeScreen>, setScreen: (s: ArcadeScreen) => void) {
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && screenRef.current === 'playing') setScreen('paused')
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [screenRef, setScreen])
}

/** Whether a key event came from a text field or a focused control, where the game should not take it. */
export function keyBelongsToPage(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  return Boolean(target && (target.closest('input, textarea, [contenteditable="true"]') || (target.closest('button, a') && event.key === 'Enter')))
}

/** Whether a pointer event landed on the frame's own buttons, links or dialogs. */
export function pointerOnControl(event: React.PointerEvent): boolean {
  return Boolean((event.target as HTMLElement).closest('button, a, [role="dialog"]'))
}

interface ArcadeFrameProps {
  game: ArcadeGameId
  screen: ArcadeScreen
  score: number
  best: number
  outcome: ArcadeOutcome | null
  signedIn: boolean
  /** The player has no character of their own yet (a stand-in is playing). */
  standIn: boolean
  /** 3D support: null while checking, false when the browser has it off. */
  support: boolean | null
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onRestart: () => void
  /** The big call to action on the ready screen ("Tap to swim"), and the smaller hint under it. */
  readyAction: string
  readyHint: string
  /** Where the ready message sits: low (over open water in a swim game) or high (over the water above a runner's floor). */
  readyAt?: 'low' | 'high'
  /** Raw pointer handlers on the play area (presses on the frame's own controls are filtered out). */
  onPointerDown?: (event: React.PointerEvent) => void
  onPointerUp?: (event: React.PointerEvent) => void
  onPointerMove?: (event: React.PointerEvent) => void
  /** Changes when the score hits a milestone: the score gives a short pulse. */
  scorePulse?: number
  /** Extra layers over the canvas and under the controls (dimmed edges, a flash). */
  children?: React.ReactNode
}

/** The full-screen frame every arcade game plays in. Rendered into body so nothing sits over it. */
export function ArcadeFrame(props: ArcadeFrameProps) {
  const { game: gameId, screen, score, best, outcome, signedIn, standIn, support, canvasRef, onRestart } = props
  const game = ARCADE_GAMES[gameId]
  const [authOpen, setAuthOpen] = useState(false)
  const unit = game.unit ? ` ${game.unit}` : ''
  const scoreRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = scoreRef.current
    if (!props.scorePulse || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', color: '#00c3ff' }, { transform: 'scale(1)' }],
      { duration: 480, easing: 'ease-out' },
    )
  }, [props.scorePulse])

  // The game owns the whole screen: nothing else scrolls or sits on top of it while it is open.
  useEffect(() => {
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = before
    }
  }, [])

  const showResults = screen === 'over' && outcome
  const xp = outcome?.result?.xp ?? 0

  const frame = (
    <div
      className="fixed inset-0 z-[100050] overflow-hidden bg-abyss font-sans text-ink select-none touch-none overscroll-none"
      onPointerDown={(event) => {
        if (pointerOnControl(event)) return
        event.preventDefault()
        props.onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        if (pointerOnControl(event)) return
        props.onPointerUp?.(event)
      }}
      onPointerCancel={(event) => props.onPointerUp?.(event)}
      onPointerMove={props.onPointerMove}
      data-testid={`${gameId}-game`}
      data-screen={screen}
    >
      {support !== false && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label={`${game.title} game`} />}
      {props.children}

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
        <span className="mt-1.5 rounded-full bg-abyss/60 px-2.5 py-1 text-xs text-ink-body tabular-nums">
          Best {best}
          {unit}
        </span>
        {screen !== 'loading' && (
          <span ref={scoreRef} className="rounded-full bg-abyss/60 px-4 py-1 font-grotesk text-2xl font-semibold text-ink tabular-nums" aria-live={game.unit ? 'off' : 'polite'}>
            {score}
            {game.unit && <span className="ml-0.5 text-base text-ink-muted">{game.unit}</span>}
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
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 flex flex-col items-center gap-1.5 px-4 text-center',
            props.readyAt === 'high' ? 'top-[max(22%,calc(env(safe-area-inset-top)+5rem))]' : 'bottom-[max(18%,calc(env(safe-area-inset-bottom)+6rem))]',
          )}
        >
          <p className="font-grotesk text-2xl font-semibold tracking-tight text-ink">{game.title}</p>
          <span className="rounded-full bg-abyss/70 px-4 py-2 text-sm font-medium text-ink">{props.readyAction}</span>
          <span className="rounded-full bg-abyss/60 px-3 py-1 text-xs text-ink-body">{props.readyHint}</span>
          {standIn && (
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
          <div role="dialog" aria-label="Run over" className="w-full max-w-xs rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5 text-center shadow-menu">
            <p className="eyebrow">Run over</p>
            <p className="mt-1 font-grotesk text-2xl font-semibold text-ink tabular-nums">
              {outcome.score}
              {unit}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {outcome.isBest ? (
                <span className="text-emerald-500">New best</span>
              ) : (
                <>
                  Best {outcome.best}
                  {unit}
                </>
              )}
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
                      : `Score ${game.minRewardScore}${unit} or more to earn ${ARCADE_XP_PER_RUN} XP.`}
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <HudButton type="button" variant="primary" fullWidth onClick={onRestart} icon={<RotateCcw className="w-4 h-4" />}>
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

  return typeof document === 'undefined' ? null : createPortal(frame, document.body)
}
