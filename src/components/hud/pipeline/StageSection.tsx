import React from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpen, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StagePipelineInfo } from '@/lib/codexData'
import {
  PIPELINE_CLEARANCES,
  clearanceStatus,
  nextClearanceProgress,
  type Clearance,
} from '@/lib/pipeline-explorer'
import {
  READINGS,
  clearanceRowId,
  formatXp,
  readingValues,
  stageAccent,
  stageName,
  stageSectionId,
  xpRangeLabel,
} from './shared'

function StatusTag({ clearance, xp }: { clearance: Clearance; xp: number }) {
  const status = clearanceStatus(clearance.index, xp)
  if (status === 'cleared') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-400">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Cleared
      </span>
    )
  }
  if (status === 'current') {
    return <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">You are here</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      Opens at {formatXp(clearance.minXp)}
    </span>
  )
}

function ProgressToNext({ xp }: { xp: number }) {
  const progress = nextClearanceProgress(xp)
  if (!progress) {
    return <p className="text-xs font-bold text-ink">This is the last clearance.</p>
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-ink">
        {formatXp(progress.remainingXp)} to {progress.next.code}
      </p>
      <div
        role="progressbar"
        aria-label={`Progress to ${progress.next.code}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="h-1.5 overflow-hidden rounded-chip bg-surface-1"
      >
        <div className="h-full bg-cyan-glow" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  )
}

function ClearanceRow({ clearance, xp }: { clearance: Clearance; xp: number }) {
  const accent = stageAccent(clearance.stageNum)
  const current = clearanceStatus(clearance.index, xp) === 'current'
  const values = readingValues(clearance)

  return (
    <li
      id={clearanceRowId(clearance.code)}
      aria-current={current ? 'step' : undefined}
      className={cn(
        'scroll-mt-20 rounded-card border p-3 sm:p-4',
        current ? 'border-transparent bg-surface-3 shadow-nav-current' : 'border-line-subtle'
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-grotesk text-sm font-bold uppercase tracking-[0.04em] text-ink sm:text-base">
          <span className={cn('mr-2', accent.text)}>{clearance.code}</span>
          {clearance.sub.shortTitle}
        </h3>
        <StatusTag clearance={clearance} xp={xp} />
      </div>
      <p className="mt-2 text-sm font-bold text-ink">{clearance.sub.protocol}</p>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-body">{clearance.sub.requirement}</p>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {READINGS.map((reading, i) => (
          <div key={reading.label} className="flex gap-1.5">
            <dt className="text-ink-muted">{reading.label}</dt>
            <dd className="font-bold text-ink">{values[i]}</dd>
          </div>
        ))}
      </dl>
      {current ? (
        <div className="mt-3 border-t border-line-subtle pt-3">
          <ProgressToNext xp={xp} />
        </div>
      ) : null}
    </li>
  )
}

/** One stage: what it is, its XP range, and its three clearances in order. */
export function StageSection({ stage, xp }: { stage: StagePipelineInfo; xp: number }) {
  const accent = stageAccent(stage.stageNum)
  const clearances = PIPELINE_CLEARANCES.filter((c) => c.stageNum === stage.stageNum)
  const scriptureSlug = clearances[0]?.scriptureSlug
  const headingId = `${stageSectionId(stage.stageNum)}-title`

  return (
    <section
      id={stageSectionId(stage.stageNum)}
      aria-labelledby={headingId}
      className="scroll-mt-20 rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <div className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', accent.text)}>
            Stage {stage.stageNum} · {xpRangeLabel(stage.stageNum)}
          </div>
          <h2 id={headingId} className="font-grotesk text-xl font-extrabold uppercase tracking-[0.04em] text-ink">
            {stageName(stage.stageTitle)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-body">{stage.subtitle}</p>
        </div>
        {scriptureSlug ? (
          <Link
            to="/codex/$slug"
            params={{ slug: scriptureSlug }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-glow hover:text-cyan-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Read the scripture
          </Link>
        ) : null}
      </div>
      <ol className="mt-4 space-y-2.5">
        {clearances.map((clearance) => (
          <ClearanceRow key={clearance.code} clearance={clearance} xp={xp} />
        ))}
      </ol>
    </section>
  )
}
