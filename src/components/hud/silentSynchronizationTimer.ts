export const SILENT_SYNC_PRESETS = [1, 3, 5, 10] as const
export type SilentSyncMinutes = (typeof SILENT_SYNC_PRESETS)[number]

export const silentSyncDurationMs = (minutes: SilentSyncMinutes) => minutes * 60_000

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

export function formatSilentSyncTime(milliseconds: number) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
