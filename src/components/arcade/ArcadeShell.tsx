import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Pause, Play, RotateCcw, Shell, Trophy, UserPlus, Volume2, VolumeX, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HUDSpinner } from '@/components/ui/HUDSpinner'
import { AuthModal } from '@/components/AuthModal'
import { ARCADE_GAMES, ARCADE_XP_PER_RUN, type ArcadeGameId } from '@/lib/arcade'
import { finishArcadeRunFn, startArcadeRunFn, type ArcadeRunResult } from '@/lib/server/api'
import { authToken } from '@/lib/query/account'
import { isArcadeMuted, setArcadeMuted, subscribeArcadeMuted, unlockArcadeSound } from '@/lib/arcade/sound'
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

/**
 * Pausing: a run in progress pauses when the tab is hidden or the window loses focus, and Escape
 * or P pause and carry on. (A tap, click or the game's own keys also carry on.)
 */
export function usePauseWhenHidden(screenRef: React.MutableRefObject<ArcadeScreen>, setScreen: (s: ArcadeScreen) => void) {
  useEffect(() => {
    const pause = () => {
      if (screenRef.current === 'playing') setScreen('paused')
    }
    const onHide = () => {
      if (document.hidden) pause()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || keyBelongsToPage(event)) return
      if (event.key !== 'Escape' && event.key !== 'p' && event.key !== 'P') return
      if (screenRef.current === 'playing') {
        event.preventDefault()
        setScreen('paused')
      } else if (screenRef.current === 'paused') {
        event.preventDefault()
        setScreen('playing')
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', pause)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', pause)
      window.removeEventListener('keydown', onKey)
    }
  }, [screenRef, setScreen])
}

/** After a crash, how long the action holds still before the fall plays on (a beat to feel the hit). */
export const HIT_STOP_MS = 110

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
  /** Changes on a crash: the screen gives a short flash. */
  crashPulse?: number
  /** Changes when the run goes past the player's best: a "New best" tag shows under the score. */
  bestPulse?: number
  /** Where the results card sits on a phone: low (default) or high, above a runner on the sand. */
  resultsAt?: 'low' | 'high'
  /** Pause the run (the pause button shows while playing). */
  onPause?: () => void
  /** Extra layers over the canvas and under the controls (dimmed edges, a flash). */
  children?: React.ReactNode
}

const ROUND_BUTTON =
  'pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-abyss/60 text-ink-body hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** The full-screen frame every arcade game plays in. Rendered into body so nothing sits over it. */
export function ArcadeFrame(props: ArcadeFrameProps) {
  const { game: gameId, screen, score, best, outcome, signedIn, standIn, support, canvasRef, onRestart } = props
  const game = ARCADE_GAMES[gameId]
  const [authOpen, setAuthOpen] = useState(false)
  const unit = game.unit ? ` ${game.unit}` : ''
  const scoreRef = useRef<HTMLSpanElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const bestTagRef = useRef<HTMLSpanElement>(null)
  const muted = useSyncExternalStore(subscribeArcadeMuted, isArcadeMuted, () => true)

  useEffect(() => {
    const el = scoreRef.current
    if (!props.scorePulse || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', color: '#00c3ff' }, { transform: 'scale(1)' }],
      { duration: 480, easing: 'ease-out' },
    )
  }, [props.scorePulse])

  useEffect(() => {
    const el = flashRef.current
    if (!props.crashPulse || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' })
  }, [props.crashPulse])

  useEffect(() => {
    const el = bestTagRef.current
    if (!props.bestPulse || !el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.animate(
      still
        ? [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: 'translateY(-4px) scale(0.9)' },
            { opacity: 1, transform: 'translateY(0) scale(1.08)', offset: 0.12 },
            { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.85 },
            { opacity: 0, transform: 'translateY(0) scale(1)' },
          ],
      { duration: 1600, easing: 'ease-out' },
    )
  }, [props.bestPulse])

  // Sound can only start after a press; any key counts.
  useEffect(() => {
    window.addEventListener('keydown', unlockArcadeSound)
    return () => window.removeEventListener('keydown', unlockArcadeSound)
  }, [])

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
      className="fixed inset-0 z-[100050] overflow-hidden bg-abyss font-sans text-ink select-none touch-none overscroll-none [-webkit-touch-callout:none]"
      onPointerDown={(event) => {
        unlockArcadeSound()
        if (pointerOnControl(event)) return
        // Only the main mouse button plays; right and middle clicks do nothing.
        if (event.pointerType === 'mouse' && event.button !== 0) return
        event.preventDefault()
        props.onPointerDown?.(event)
      }}
      // A long press (holding a side to steer) must not open the phone's callout or menu.
      onContextMenu={(event) => event.preventDefault()}
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
      <div ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 bg-white opacity-0" />

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

      {/* Top bar: best on the left, the score in the middle, sound, pause and close on the right. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="mt-1.5 rounded-full bg-abyss/60 px-2.5 py-1 text-xs text-ink-body tabular-nums">
          Best {best}
          {unit}
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted} onClick={() => setArcadeMuted(!muted)} className={ROUND_BUTTON}>
            {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
          </button>
          {screen === 'playing' && props.onPause && (
            <button type="button" aria-label="Pause" onClick={props.onPause} className={ROUND_BUTTON}>
              <Pause className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <Link to="/arcade" aria-label="Close game" className={ROUND_BUTTON}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      {screen !== 'loading' && (
        <div className="pointer-events-none absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] flex -translate-x-1/2 flex-col items-center gap-1">
          <span ref={scoreRef} className="rounded-full bg-abyss/60 px-4 py-1 font-grotesk text-2xl font-semibold text-ink tabular-nums" aria-live={game.unit ? 'off' : 'polite'}>
            {score}
            {game.unit && <span className="ml-0.5 text-base text-ink-muted">{game.unit}</span>}
          </span>
          <span ref={bestTagRef} className="rounded-full bg-abyss/70 px-2.5 py-0.5 text-xs font-medium text-amber-300 opacity-0">
            New best
          </span>
        </div>
      )}

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
            <Play className="w-4 h-4" aria-hidden="true" /> Paused. Tap or press P to carry on
          </span>
        </div>
      )}

      {showResults && (
        // Low on a phone and to the right on wider screens, so the crash itself stays in view.
        <div
          className={cn(
            'absolute inset-0 flex justify-center bg-abyss/25 p-3 sm:items-center sm:justify-end sm:p-6 sm:pr-[max(1.5rem,7vw)]',
            props.resultsAt === 'high' ? 'items-start pt-[max(5rem,16%)]' : 'items-end pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          )}
        >
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
            {!outcome.isBest && outcome.best > outcome.score && (
              <p className="mt-1 text-xs text-ink-muted tabular-nums">
                {outcome.best - outcome.score}
                {unit} short of your best
              </p>
            )}
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
