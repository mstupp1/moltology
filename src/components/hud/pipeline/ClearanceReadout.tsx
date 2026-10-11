import React from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen, Check, ChevronDown, ChevronUp, Lock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PIPELINE_CLEARANCES, type Clearance, type ClearanceStatus } from '@/lib/pipeline-explorer'
import { formatXp, metricReadings, stageAccent, stageName, type MetricKey } from './shared'

interface ClearanceReadoutProps {
  clearance: Clearance
  status: ClearanceStatus
  xp: number
  activeMetric: MetricKey | null
  onActiveMetricChange: (metric: MetricKey | null) => void
  onStep: (direction: -1 | 1) => void
}

function StatusLine({ clearance, status, xp }: { clearance: Clearance; status: ClearanceStatus; xp: number }) {
  if (status === 'cleared') {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        Cleared. Opened at {formatXp(clearance.minXp)}.
      </div>
    )
  }

  if (status === 'ahead') {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-ink-body">
        <Lock className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        Opens at {formatXp(clearance.minXp)}. {formatXp(clearance.minXp - xp)} to go.
      </div>
    )
  }

  const next = PIPELINE_CLEARANCES[clearance.index + 1]
  if (!next || clearance.nextMinXp === null) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-crimson-text">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        You are here. This is the floor.
      </div>
    )
  }

  const span = clearance.nextMinXp - clearance.minXp
  const into = Math.max(0, Math.min(span, xp - clearance.minXp))
  const pct = Math.round((into / span) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-bold text-crimson-text">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        You are here. {formatXp(clearance.nextMinXp - Math.max(xp, clearance.minXp))} to {next.code}.
      </div>
      <div
        role="progressbar"
        aria-label={`Progress to ${next.code}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 overflow-hidden rounded-chip bg-surface-3"
      >
        <div className="h-full bg-crimson-aggro transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Everything known about one clearance: the rite, its typical readings and where the member stands. */
export function ClearanceReadout({
  clearance,
  status,
  xp,
  activeMetric,
  onActiveMetricChange,
  onStep,
}: ClearanceReadoutProps) {
  const accent = stageAccent(clearance.stageNum)
  const readings = metricReadings(clearance)
  const isFirst = clearance.index === 0
  const isLast = clearance.index === PIPELINE_CLEARANCES.length - 1

  return (
    <div className="flex h-full flex-col gap-4 rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 sm:p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', accent.text)}>
            Stage {clearance.stageNum} · {stageName(clearance.stage.stageTitle)}
          </span>
        </div>
        <h2 className="font-grotesk text-2xl font-extrabold uppercase tracking-[0.04em] text-ink" aria-live="polite">
          <span className="sr-only">Clearance </span>
          {clearance.code} {clearance.sub.shortTitle}
        </h2>
        <StatusLine clearance={clearance} status={status} xp={xp} />
      </div>

      <div className="space-y-3 border-t border-line-subtle pt-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Protocol</div>
          <p className="text-sm font-bold text-ink">{clearance.sub.protocol}</p>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">The rite</div>
          <p className="text-sm leading-relaxed text-ink-body">{clearance.sub.requirement}</p>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-line-subtle pt-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Typical readings</div>
        {readings.map((reading) => {
          const active = activeMetric === reading.key
          return (
            <button
              key={reading.key}
              type="button"
              aria-pressed={active}
              onClick={() => onActiveMetricChange(active ? null : reading.key)}
              className={cn(
                'block w-full rounded-control border p-2 text-left transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                active ? 'border-line-strong bg-surface-2' : 'border-transparent hover:bg-surface-2'
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-bold text-ink">{reading.label}</span>
                <span className="font-grotesk text-xs font-bold" style={{ color: accent.hex }}>
                  {reading.value}
                </span>
              </span>
              <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded-chip bg-surface-3">
                <span
                  className="block h-full transition-[width] duration-700"
                  style={{ width: `${Math.max(2, Math.round(reading.ratio * 100))}%`, background: accent.hex }}
                />
              </span>
              <span className="mt-1 block text-[11px] text-ink-muted">{reading.meaning}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            disabled={isFirst}
            aria-label="Previous clearance (shallower)"
            className="inline-flex min-h-10 items-center gap-1 rounded-control border border-line bg-surface-1 px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
            Up
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            disabled={isLast}
            aria-label="Next clearance (deeper)"
            className="inline-flex min-h-10 items-center gap-1 rounded-control border border-line bg-surface-1 px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
            Down
          </button>
        </div>
        {clearance.scriptureSlug ? (
          <Link
            to="/codex/$slug"
            params={{ slug: clearance.scriptureSlug }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-glow hover:text-cyan-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Stage {clearance.stageNum} scripture
          </Link>
        ) : null}
      </div>
    </div>
  )
}
