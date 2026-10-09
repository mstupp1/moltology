import React, { useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarCheck, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAILY_ALIGNMENT_HUB_ID, TOTAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { XP_CONFIG } from '@/lib/progression'
import {
  PIPELINE_CLEARANCES,
  dailyLiturgyXp,
  formatDayCount,
  projectDaysToTargets,
} from '@/lib/pipeline-explorer'
import { formatXp, stageAccent } from './shared'

interface DescentPlannerProps {
  xp: number
  currentIndex: number
  selectedIndex: number
  onSelect: (index: number) => void
}

const PACES = Array.from({ length: TOTAL_ALIGNMENT_TASKS }, (_, i) => i + 1)

/** Pick a daily pace and see when each deeper clearance opens, using the real XP rules. */
export function DescentPlanner({ xp, currentIndex, selectedIndex, onSelect }: DescentPlannerProps) {
  const [pace, setPace] = useState(TOTAL_ALIGNMENT_TASKS)
  const paceRefs = useRef<Array<HTMLButtonElement | null>>([])

  const days = useMemo(
    () => projectDaysToTargets(xp, pace, PIPELINE_CLEARANCES.map((c) => c.minXp)),
    [xp, pace]
  )
  const ahead = PIPELINE_CLEARANCES.filter((c) => c.index > currentIndex)
  const next = ahead[0]
  const firstMilestone = XP_CONFIG.streakMilestones[0]
  const lastMilestone = XP_CONFIG.streakMilestones[XP_CONFIG.streakMilestones.length - 1]

  const choosePace = (value: number, focus = false) => {
    const clamped = Math.max(1, Math.min(TOTAL_ALIGNMENT_TASKS, value))
    setPace(clamped)
    if (focus) paceRefs.current[clamped - 1]?.focus()
  }

  const onPaceKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') choosePace(pace + 1, true)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') choosePace(pace - 1, true)
    else if (event.key === 'Home') choosePace(1, true)
    else if (event.key === 'End') choosePace(TOTAL_ALIGNMENT_TASKS, true)
    else return
    event.preventDefault()
  }

  return (
    <section
      aria-labelledby="pipeline-planner-title"
      className="grid gap-4 rounded-card border border-line-subtle bg-surface-1 hud-sheen p-4 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">
            <Waves className="h-3.5 w-3.5" aria-hidden="true" />
            Dive planner
          </div>
          <h2 id="pipeline-planner-title" className="font-grotesk text-xl font-extrabold uppercase tracking-[0.04em] text-ink">
            How fast can you sink?
          </h2>
          <p className="text-sm leading-relaxed text-ink-body">
            XP is what carries you down, and it comes from your daily liturgies. Pick a pace to see when each
            clearance opens.
          </p>
        </div>

        <div className="space-y-2">
          <div id="pipeline-pace-label" className="flex items-baseline justify-between text-xs font-bold text-ink">
            <span>Liturgies a day</span>
            <span className="font-grotesk text-cyan-glow">
              {pace} of {TOTAL_ALIGNMENT_TASKS} · {formatXp(dailyLiturgyXp(pace))} a day
            </span>
          </div>
          <div role="radiogroup" aria-labelledby="pipeline-pace-label" className="grid grid-cols-8 gap-1">
            {PACES.map((value) => {
              const checked = value === pace
              return (
                <button
                  key={value}
                  ref={(node) => {
                    paceRefs.current[value - 1] = node
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${value} a day`}
                  tabIndex={checked ? 0 : -1}
                  onClick={() => choosePace(value)}
                  onKeyDown={onPaceKeyDown}
                  className={cn(
                    'flex min-h-10 items-end justify-center rounded-control border pb-1.5 font-grotesk text-xs font-bold transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                    value <= pace
                      ? 'border-cyan-glow/60 bg-cyan-soft text-cyan-glow'
                      : 'border-line-subtle bg-surface-2 text-ink-muted hover:border-line'
                  )}
                  style={value <= pace ? { boxShadow: `inset 0 ${-4 - value * 2}px 0 rgba(0, 195, 255, 0.18)` } : undefined}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-card border border-line-subtle bg-abyss/60 p-4">
          {next ? (
            <p className="text-sm leading-relaxed text-ink-body">
              At {pace} a day, <strong className="text-ink">{next.code} {next.sub.shortTitle}</strong> opens in{' '}
              <strong className="font-grotesk text-cyan-glow">{formatDayCount(days[next.index])}</strong>.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-ink-body">
              You have reached the floor. Every clearance is open behind you.
            </p>
          )}
        </div>

        <ul className="space-y-1.5 text-xs text-ink-body">
          <li>
            <strong className="text-ink">+{XP_CONFIG.taskCompletionXp} XP</strong> for each liturgy.
          </li>
          <li>
            <strong className="text-ink">+{XP_CONFIG.allTasksDailyBonusXp} XP</strong> when all {TOTAL_ALIGNMENT_TASKS} are done in a day.
          </li>
          <li>
            <strong className="text-ink">Streak bonuses</strong> from +{firstMilestone.bonusXp} XP at {firstMilestone.days} full days
            to +{lastMilestone.bonusXp.toLocaleString('en-US')} XP at {lastMilestone.days}. They count above only at {TOTAL_ALIGNMENT_TASKS} a day.
          </li>
        </ul>

        <Link
          to="/dashboard"
          hash={DAILY_ALIGNMENT_HUB_ID}
          className="group/hudbtn relative isolate inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-[18px] font-grotesk text-xs font-bold uppercase leading-none tracking-[0.08em] text-abyss [--hud-cut:10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <span aria-hidden="true" className="hud-cut absolute -inset-px -z-10 rounded-control bg-cyan-glow transition-colors group-hover/hudbtn:bg-cyan-hover" />
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Open today's liturgies
        </Link>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          <span>Clearances ahead</span>
          <span>Arrives in</span>
        </div>
        {ahead.length === 0 ? (
          <p className="text-sm text-ink-body">Nothing deeper. The trench is yours to steward.</p>
        ) : (
          <ol className="relative space-y-1">
            {ahead.map((clearance) => {
              const accent = stageAccent(clearance.stageNum)
              const selected = clearance.index === selectedIndex
              return (
                <li key={clearance.code}>
                  <button
                    type="button"
                    onClick={() => onSelect(clearance.index)}
                    aria-label={`Scan ${clearance.code} ${clearance.sub.shortTitle}, opens at ${formatXp(clearance.minXp)}, arrives in ${formatDayCount(days[clearance.index])}`}
                    className={cn(
                      'grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-control border px-3 py-2 text-left transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                      selected ? 'border-line-strong bg-surface-2' : 'border-transparent hover:border-line hover:bg-surface-2'
                    )}
                  >
                    <span className={cn('font-grotesk text-sm font-bold tracking-[0.08em]', accent.text)}>{clearance.code}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{clearance.sub.shortTitle}</span>
                      <span className="block text-[11px] text-ink-muted">Opens at {formatXp(clearance.minXp)}</span>
                    </span>
                    <span className="text-right font-grotesk text-xs font-bold text-ink-body">
                      {formatDayCount(days[clearance.index])}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        <p className="mt-3 text-[11px] text-ink-muted">
          Assumes the same pace every day from tomorrow, starting from your {formatXp(xp)}.
        </p>
      </div>
    </section>
  )
}
