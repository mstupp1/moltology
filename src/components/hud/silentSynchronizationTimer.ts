export const SILENT_SYNC_PRESETS = [1, 3, 5, 10] as const
export type SilentSyncMinutes = number

/** Lengths offered for a Reset your focus breather. */
export const RESET_PRESETS = [1, 2, 3] as const

/** Lengths offered for a deep work session. */
export const DEEP_WORK_PRESETS = [15, 25, 45, 60] as const

export const silentSyncDurationMs = (minutes: SilentSyncMinutes) => minutes * 60_000

/** 1500000 -> "25:00" */
export function formatTimerClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getSilentSyncProgress(startedAt: number, durationMs: number, now: number) {
  const elapsedMs = Math.max(0, Math.min(durationMs, now - startedAt))
  return {
    elapsedMs,
    remainingMs: Math.max(0, durationMs - elapsedMs),
    progress: durationMs > 0 ? elapsedMs / durationMs : 1,
    complete: elapsedMs >= durationMs,
    cycles: Math.floor(elapsedMs / 1000),
  }
}
