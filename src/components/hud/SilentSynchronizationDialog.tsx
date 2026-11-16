import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { UserAvatar } from '@/components/UserAvatar'
import { HudButton } from '@/components/ui/HudButton'
import { createSilentSynchronizationBridge } from './silentSynchronizationBridge'
import './silent-synchronization.css'
import {
  DEEP_WORK_PRESETS,
  RESET_PRESETS,
  formatTimerClock,
  getSilentSyncProgress,
  SILENT_SYNC_PRESETS,
  silentSyncDurationMs,
  type SilentSyncMinutes,
} from './silentSynchronizationTimer'
import type { AlignmentPractice } from '@/lib/alignment-actions'

const PRACTICE_COPY: Record<AlignmentPractice, {
  eyebrow: string
  title: string
  aria: string
  instructions: string
  presets: readonly number[]
  defaultMinutes: number
  running: string
}> = {
  silent: {
    eyebrow: 'Quiet practice',
    title: 'Silent synchronization',
    aria: 'Silent synchronization timer',
    instructions: 'Sit quietly while the Oracle synchronizes. Select Start timer to begin. You can stop at any time.',
    presets: SILENT_SYNC_PRESETS,
    defaultMinutes: 3,
    running: 'Syncing',
  },
  reset: {
    eyebrow: 'Breathing timer',
    title: 'Reset your focus',
    aria: 'Reset your focus timer',
    instructions: 'Breathe in slowly, then out a little slower. Look away from the screen. You can stop at any time.',
    presets: RESET_PRESETS,
    defaultMinutes: 1,
    running: 'Breathing',
  },
  'deep-work': {
    eyebrow: 'Focus timer',
    title: 'Deep work',
    aria: 'Deep work timer',
    instructions: 'Pick a length, silence your notifications and work on one thing. You can stop at any time.',
    presets: DEEP_WORK_PRESETS,
    defaultMinutes: 25,
    running: 'Focusing',
  },
}

const SynapticEntityCanvas = lazy(() =>
  import('@/components/ai/SynapticEntityCanvas').then((module) => ({ default: module.SynapticEntityCanvas }))
)

export interface SilentSynchronizationDialogProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  avatarUrl?: string | null
  avatarName?: string
  /** Which daily practice this timer is for. */
  practice?: AlignmentPractice
}

type SessionState = 'ready' | 'running' | 'complete'
const VISUAL_PREF_KEY = 'moltology.silent-sync-3d'

function readVisualPreference() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(VISUAL_PREF_KEY) !== 'false'
  } catch {
    return true
  }
}

export function SilentSynchronizationDialog({
  open,
  onClose,
  onComplete,
  avatarUrl,
  avatarName = 'Your profile',
  practice = 'silent',
}: SilentSynchronizationDialogProps) {
  const copy = PRACTICE_COPY[practice]
  const presetColumns = copy.presets.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
  const [minutes, setMinutes] = useState<SilentSyncMinutes>(copy.defaultMinutes)
  const [session, setSession] = useState<SessionState>('ready')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [visualEnabled, setVisualEnabled] = useState(readVisualPreference)
  const [reducedMotion, setReducedMotion] = useState(false)
  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const previousOpenRef = useRef(open)
  const bridge = useMemo(() => createSilentSynchronizationBridge(), [])

  const completeOnce = useCallback(() => {
    if (startedRef.current && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [onComplete])
  const handleClose = useCallback(() => {
    completeOnce()
    onClose()
  }, [completeOnce, onClose])

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      completedRef.current = false
      startedRef.current = false
      setSession('ready')
      setMinutes(copy.defaultMinutes)
      setStartedAt(null)
      setNow(Date.now())
    } else if (!open && previousOpenRef.current) {
      completeOnce()
    }
    previousOpenRef.current = open
  }, [open, completeOnce, copy.defaultMinutes])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  const durationMs = silentSyncDurationMs(minutes)
  const progress = startedAt === null
    ? { elapsedMs: 0, remainingMs: durationMs, progress: 0, complete: false, cycles: 0 }
    : getSilentSyncProgress(startedAt, durationMs, now)

  useEffect(() => {
    if (!open || session !== 'running' || startedAt === null) return
    const update = () => {
      const timestamp = Date.now()
      setNow(timestamp)
      if (getSilentSyncProgress(startedAt, durationMs, timestamp).complete) {
        setSession('complete')
        completeOnce()
      }
    }
    update()
    const interval = window.setInterval(update, 200)
    return () => window.clearInterval(interval)
  }, [open, session, startedAt, durationMs, completeOnce])

  const start = () => {
    completedRef.current = false
    startedRef.current = true
    const timestamp = Date.now()
    setStartedAt(timestamp)
    setNow(timestamp)
    setSession('running')
  }

  const stop = () => {
    if (session !== 'running') return
    setSession('complete')
    completeOnce()
  }

  const toggleVisual = () => {
    setVisualEnabled((current) => {
      const next = !current
      try {
        window.localStorage.setItem(VISUAL_PREF_KEY, String(next))
      } catch {
        // The timer still works when browser storage is unavailable.
      }
      return next
    })
  }

  useEffect(() => {
    bridge.setRunning(open && session === 'running')
  }, [bridge, open, session])

  const running = session === 'running'
  const showCanvas = visualEnabled && !reducedMotion

  return (
    <HudBottomSheet
      isOpen={open}
      onClose={handleClose}
      title={copy.title}
      ariaLabel={copy.aria}
      showHandle={false}
      contentLayout="fill"
      maxHeight="min(92dvh, 760px)"
      containerClassName="items-center p-3 sm:justify-center sm:p-6"
      className="w-full max-w-xl rounded-panel border border-line-subtle bg-surface-1 p-0 shadow-2xl"
    >
      <section className="flex max-h-[min(92dvh,760px)] flex-col overflow-y-auto" aria-describedby="silent-sync-instructions">
        <header className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-glow">{copy.eyebrow}</p>
            <h2 className="mt-1 font-grotesk text-xl font-bold text-ink sm:text-2xl">{copy.title}</h2>
          </div>
          <HudButton variant="ghost" size="sm" onClick={handleClose} aria-label="Close dialog">
            Close
          </HudButton>
        </header>

        <div className="px-5 pb-6 pt-4 sm:px-7">
          <p id="silent-sync-instructions" className="text-sm leading-relaxed text-ink-body">
            {copy.instructions}
          </p>

          <div className="relative my-5 flex min-h-44 items-center justify-center overflow-hidden rounded-card border border-line-subtle bg-abyss px-4 py-5 sm:min-h-52">
            <div className="relative z-10 flex w-full max-w-sm items-center justify-between gap-4">
              <div className={`relative grid size-20 shrink-0 place-items-center rounded-full border border-cyan-glow/40 bg-surface-1 sm:size-24 ${running ? 'silent-sync-pulse shadow-md shadow-cyan-glow/20' : ''}`}>
                {showCanvas ? (
                  <Suspense fallback={<span className="size-9 rounded-full bg-cyan-glow/15" />}>
                    <div className="pointer-events-none absolute -inset-3">
                      <SynapticEntityCanvas bridge={bridge} isCompact className="h-full w-full !min-h-0" />
                    </div>
                  </Suspense>
                ) : (
                  <span aria-hidden="true" className="size-9 rounded-full border border-cyan-glow/60 bg-cyan-glow/15" />
                )}
                <span className="absolute -bottom-5 text-[11px] font-bold uppercase tracking-widest text-ink-muted">Core</span>
              </div>
              <div aria-hidden="true" className={`h-px min-w-6 flex-1 bg-gradient-to-r from-cyan-glow/20 via-cyan-glow to-cyan-glow/20 ${running && !reducedMotion ? 'silent-sync-flow' : ''}`} />
              <div className={`relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-glow/40 bg-surface-2 sm:size-24 ${running ? 'silent-sync-pulse shadow-md shadow-cyan-glow/20' : ''}`}>
                <UserAvatar src={avatarUrl} name={avatarName} alt={avatarName} size="xl" borderless className="!h-full !w-full" />
                <span className="sr-only">{avatarName}</span>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] uppercase tracking-[0.16em] text-ink-muted">{running ? copy.running : session === 'complete' ? 'Session complete' : 'Ready'}</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-ink-muted">3D experience</span>
            <HudButton
              variant="secondary"
              size="sm"
              role="switch"
              aria-label="3D experience"
              aria-checked={visualEnabled}
              onClick={toggleVisual}
            >
              {visualEnabled ? 'On' : 'Off'}
            </HudButton>
          </div>

          {session === 'ready' ? (
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-medium text-ink-muted">Duration</legend>
              <div className={`grid ${presetColumns} gap-2`} role="group" aria-label="Timer duration">
                {copy.presets.map((preset) => (
                  <HudButton
                    key={preset}
                    variant="secondary"
                    aria-pressed={minutes === preset}
                    onClick={() => setMinutes(preset)}
                    className={`!px-1 ${minutes === preset ? 'border-cyan-glow bg-cyan-soft' : ''}`}
                  >
                    {preset} min
                  </HudButton>
                ))}
              </div>
            </fieldset>
          ) : practice !== 'silent' ? (
            <div className="mt-5">
              <div className="flex items-end justify-between">
                <span className="text-xs text-ink-muted">{running ? 'Time left' : 'Time worked'}</span>
                <span className="font-mono text-2xl tabular-nums text-ink" data-testid="silent-sync-readout">
                  {formatTimerClock(running ? progress.remainingMs : progress.elapsedMs)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-chip bg-surface-3" role="progressbar" aria-label="Timer progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progress * 100)}>
                <div className="h-full rounded-chip bg-cyan-glow transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex items-end justify-between">
                <span className="text-xs text-ink-muted">{running ? 'Sync cycles remaining' : 'Sync cycles completed'}</span>
                <span className="font-mono text-2xl tabular-nums text-ink" data-testid="silent-sync-readout">{running ? Math.ceil(progress.remainingMs / 1000) : progress.cycles}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-chip bg-surface-3" role="progressbar" aria-label="Timer progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progress * 100)}>
                <div className="h-full rounded-chip bg-cyan-glow transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-muted">{progress.cycles} sync {progress.cycles === 1 ? 'cycle' : 'cycles'} completed</p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {session === 'ready' ? (
              <HudButton variant="primary" onClick={start}>Start timer</HudButton>
            ) : running ? (
              <HudButton variant="secondary" onClick={stop}>Stop</HudButton>
            ) : (
              <HudButton variant="secondary" onClick={handleClose}>Close</HudButton>
            )}
          </div>
        </div>
      </section>
    </HudBottomSheet>
  )
}

export default SilentSynchronizationDialog
