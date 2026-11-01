import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Flame } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudButton } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useLastOracleThread } from '@/hooks/useLastOracleThread'
import { oracleRouteSearch } from '@/lib/ai/last-oracle-thread'
import { describeAlignmentToday, pickDashboardNextStep } from '@/lib/dashboard-next-step'
import { cn } from '@/lib/utils'
import { getAssetUrl } from '@/lib/assets'

const STAGE_ART: Record<number, string> = {
  1: 'images/dashboard/stages/larval-v1.png',
  2: 'images/dashboard/stages/soft-shed-v1.png',
  3: 'images/dashboard/stages/exoshell-v1.png',
  4: 'images/dashboard/stages/ascendant-v1.png',
}

function firstName(name?: string | null): string | null {
  const first = (name || '').trim().split(/\s+/)[0]
  return first ? first : null
}

function Meter({ ratio, done = false, label }: { ratio: number; done?: boolean; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
  return (
    <div
      className="h-1.5 w-full bg-surface-3 rounded-chip overflow-hidden"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={cn('h-full transition-[width] duration-500 motion-reduce:transition-none', done ? 'bg-emerald-500' : 'bg-cyan-glow')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Readout({ label, children, footer }: { label: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-w-0 px-3 py-2.5 flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted truncate">{label}</span>
      <div className="font-grotesk text-lg font-bold text-ink leading-none tabular-nums truncate">{children}</div>
      {footer}
    </div>
  )
}

/** Seven small marks, oldest to today: lit when that day's liturgies were all done. */
function WeekMarks({ days }: { days: Array<{ date: string; pct: number; isToday?: boolean }> }) {
  return (
    <div className="flex items-center gap-1 h-1.5" aria-hidden="true">
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            'h-1.5 flex-1 rounded-chip',
            day.pct >= 100 ? 'bg-cyan-glow' : day.pct > 0 ? 'bg-cyan-glow/35' : 'bg-surface-3',
          )}
        />
      ))}
    </div>
  )
}

/**
 * Top of the dashboard: who you are, where you stand today, and the one thing to do next.
 * Every number here is a live value from the alignment and progression state.
 */
export function DashboardTodayStrip() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const { completedCount, totalCount, streakDays, streakHistory, progression, isLoading } = useDailyAlignment()
  const lastThread = useLastOracleThread()
  const [dateLabel, setDateLabel] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  const isGuest = session.isGuest
  const name = firstName(session.user?.name)
  const step = pickDashboardNextStep({ isGuest, completedCount, totalCount, lastThread })
  const ready = !isLoading && !session.isPending
  const alignmentDone = completedCount >= totalCount
  const xpToNext = Math.max(0, progression.xpNeededForNextStage - progression.xpIntoStage)

  const stageName = progression.stageTitle.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

  const runStep = () => {
    switch (step.kind) {
      case 'join':
        setIsAuthOpen(true)
        return
      case 'alignment':
        navigate({ to: '/alignment' })
        return
      case 'resume-oracle':
        navigate({ to: '/oracle', search: oracleRouteSearch(step.threadId) })
        return
      case 'oracle':
        navigate({ to: '/oracle' })
    }
  }

  return (
    <section
      aria-labelledby="dashboard-today-heading"
      data-testid="dashboard-today"
      className="relative isolate overflow-hidden rounded-card border border-line-subtle bg-surface-1 shadow-sheen-inset"
    >
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 h-[210px] sm:h-full w-full sm:w-3/5 overflow-hidden">
          <img
            key={progression.stage}
            src={getAssetUrl(STAGE_ART[progression.stage] ?? STAGE_ART[1])}
            alt=""
            width={1536}
            height={1024}
            fetchPriority="high"
            className="absolute right-0 top-0 h-full w-full object-cover object-right motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-1 via-surface-1/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-5 sm:p-6 lg:p-8 sm:min-h-[300px] flex flex-col items-start">
          <div className="max-w-[60%] sm:max-w-[55%] space-y-2">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted min-h-[1em]">
              {dateLabel ? `Today · ${dateLabel}` : 'Today'}
            </p>
            <h1 id="dashboard-today-heading" className="font-grotesk text-base sm:text-lg font-medium text-ink-body leading-tight">
              {isGuest ? 'Welcome to the shallows' : name ? `Welcome back, ${name}` : 'Welcome back'}
            </h1>
          </div>

          <div className="mt-14 sm:mt-7 max-w-full sm:max-w-[55%]">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-cyan-glow mb-2">
              {isGuest ? 'Your journey begins here' : `Stage ${progression.stage}`}
            </p>
            <h2 className="font-grotesk text-3xl lg:text-4xl font-bold text-ink leading-tight tracking-tight">
              {stageName}
            </h2>
            {!isGuest && (
              <p className="mt-2 text-sm text-ink-body" data-testid="dashboard-clearance">
                <span className="font-mono text-cyan-glow">{progression.subStage.code}</span>
                <span className="mx-2 text-ink-muted" aria-hidden="true">·</span>
                {progression.subStage.shortTitle}
              </p>
            )}
            <p className="mt-3 text-xs text-ink-body leading-relaxed max-w-sm">
              {isGuest
                ? 'Look around freely. An account keeps your liturgies, streak and Oracle threads.'
                : ready
                  ? describeAlignmentToday(completedCount, totalCount)
                  : 'Reading today’s liturgies…'}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-1 min-w-0 w-full sm:w-auto">
            <HudButton
              variant="primary"
              size="md"
              onClick={runStep}
              disabled={!ready && !isGuest}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="w-full sm:w-auto whitespace-nowrap"
              data-testid="dashboard-next-step"
            >
              {step.label}
            </HudButton>
            {step.kind === 'resume-oracle' && (
              <span className="text-[11px] text-ink-muted truncate max-w-full sm:max-w-[16rem]" title={step.threadTitle}>
                {step.threadTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-3 min-w-0 border-t border-line-subtle bg-abyss/40 divide-x divide-line-subtle px-2 py-2 sm:px-3">
        <Readout
          label="Progress"
          footer={
            <>
              <Meter ratio={progression.progressRatio} label="Progress to the next stage" />
              <span className="text-[11px] text-ink-muted truncate">
                {progression.isMaxStage ? (
                  'Final stage'
                ) : (
                  <>
                    {xpToNext.toLocaleString('en-US')} XP
                    <span className="hidden sm:inline"> to Stage {progression.stage + 1}</span>
                    <span className="sm:hidden"> to go</span>
                  </>
                )}
              </span>
            </>
          }
        >
          {ready ? `${Math.round(progression.progressRatio * 100)}%` : '–'}
        </Readout>
        <Readout
          label="Streak"
          footer={
            <>
              <WeekMarks days={streakHistory.slice(-7)} />
              <span className="text-[11px] text-ink-muted truncate">{streakDays === 1 ? 'day in a row' : 'days in a row'}</span>
            </>
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <Flame className={cn('w-4 h-4 shrink-0', streakDays > 0 ? 'text-crimson-text' : 'text-ink-muted')} aria-hidden="true" />
            {ready ? streakDays : '–'}
          </span>
        </Readout>
        <Readout
          label="Alignment"
          footer={
            <>
              <Meter ratio={completedCount / Math.max(totalCount, 1)} done={alignmentDone} label="Today’s alignment" />
              <span className={cn('text-[11px] truncate', alignmentDone ? 'text-emerald-500' : 'text-ink-muted')}>
                {alignmentDone ? 'Done today' : 'done today'}
              </span>
            </>
          }
        >
          {ready ? `${completedCount}/${totalCount}` : '–'}
        </Readout>
      </div>

      {isGuest && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode="signup" />}
    </section>
  )
}
