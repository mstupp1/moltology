import React, { useMemo } from 'react'
import { HUDTaskBar } from './HUDTaskBar'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { calculateProgression, STAGE_THRESHOLDS } from '@/lib/progression'

export interface HUDProgressBarProps {
  stage?: number
  xp?: number
  className?: string
  showTaskBar?: boolean
  /** @deprecated Use showTaskBar */
  showClock?: boolean
}

export const HUDProgressBar: React.FC<HUDProgressBarProps> = ({
  stage: propStage,
  xp: propXp,
  className = '',
  showTaskBar,
  showClock = true,
}) => {
  const alignment = useDailyAlignment()

  // Use explicit props (e.g. testing / override) if provided; otherwise use live alignment progression
  const progression = useMemo(() => {
    if (propStage !== undefined || propXp !== undefined) {
      const explicitXp =
        propXp !== undefined
          ? propXp
          : (propStage !== undefined
              ? (STAGE_THRESHOLDS.find((s) => s.stage === propStage)?.minXp ?? 0)
              : alignment.xp)
      return calculateProgression(explicitXp, propStage)
    }
    return alignment.progression
  }, [propStage, propXp, alignment.progression, alignment.xp])

  const effectiveXp = propXp !== undefined ? propXp : progression.xp
  const isTaskBarVisible = showTaskBar !== undefined ? showTaskBar : showClock
  const nextStage = Math.min(progression.stage + 1, 4)
  const isMaxStage = progression.isMaxStage
  const progressRatio = progression.progressRatio
  const fillPercent = isMaxStage ? 100 : Math.round(progressRatio * 100)

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 font-sans select-none min-w-0 ${className}`}>
      {/* ── CENTER: Full-Space Conversion Bar with Compact Top Level Readouts ── */}
      <div className="flex-1 min-w-0 z-10 flex flex-col justify-center gap-0.5 px-0.5 sm:px-1">
        {/* Compact Level Readouts on Top: Current Stage on left, Next Stage on right */}
        <div className="flex items-center justify-between px-0.5 select-none leading-none">
          {/* Current Stage */}
          <div
            className="flex items-baseline gap-1"
            title={`Current Clearance Stage ${progression.stage}: ${progression.stageTitle}`}
            aria-label={`Stage ${progression.stage} Badge`}
          >
            <span className="text-[11px] font-semibold text-ink-muted tracking-[0.08em] uppercase">STAGE</span>
            <span className="text-[11px] sm:text-xs font-bold text-cyan-glow leading-none">
              {progression.stage}
            </span>
          </div>

          {/* Next Stage / Apex Target */}
          {!isMaxStage ? (
            <div
              className="flex items-baseline gap-1"
              title={`Next Ascension Clearance: Stage ${nextStage}`}
              aria-label={`Next Stage ${nextStage} Badge`}
            >
              <span className="text-[11px] font-semibold text-ink-muted tracking-[0.08em] uppercase">STAGE</span>
              <span className="text-[11px] sm:text-xs font-bold text-ink leading-none">
                {nextStage}
              </span>
            </div>
          ) : (
            <div
              className="flex items-baseline"
              title="Apex Carcinization Stage Reached (Stage 4 Max)"
              aria-label="Apex Stage Badge"
            >
              <span className="text-[11px] font-extrabold text-emerald-400 tracking-[0.08em] uppercase leading-none">
                APEX
              </span>
            </div>
          )}
        </div>

        {/* ═══ VERTICAL OPTIMIZED TRACK ═══ */}
        <div
          className="relative flex items-center w-full"
          style={{ height: '16px' }}
          title={
            isMaxStage
              ? `Apex Clearance Reached · ${effectiveXp.toLocaleString()} Lifetime XP (Stage 4 Max)`
              : `Ascension Progress: ${progression.xpIntoStage.toLocaleString()} / ${progression.xpNeededForNextStage.toLocaleString()} XP (${fillPercent}%) · Stage ${progression.stage} → Stage ${nextStage}`
          }
          aria-label={
            isMaxStage
              ? `Progression: Stage 4 Apex (100%)`
              : `Progression: ${fillPercent}% from Stage ${progression.stage} to Stage ${nextStage}`
          }
        >

          {/* Track shell */}
          <div
            className="relative flex-1 rounded-chip overflow-visible bg-surface-3 border border-line-subtle"
            style={{ height: '10px' }}
          >
            {/* ── FILL ── */}
            <div
              className={`absolute top-0 left-0 h-full rounded-chip overflow-hidden transition-all duration-500 ease-out ${
                isMaxStage ? 'bg-emerald-500' : 'bg-cyan-glow'
              }`}
              style={{ width: `${fillPercent}%` }}
            >
              {/* Shimmer sweep - Hardware Accelerated GPU Transform */}
              <div
                className="absolute inset-y-0 w-1/2 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  animation: 'shimmerSweep 2.2s ease-in-out infinite',
                  willChange: 'transform',
                }}
              />
              {/* Top specular stripe */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            </div>

            {/* ── PROGRESS EDGE ── */}
            {fillPercent > 0 && (
              <div
                className="absolute top-0 h-full pointer-events-none transition-all duration-500 ease-out"
                style={{
                  left: `calc(${fillPercent}% - 1.5px)`,
                  width: '3px',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '1px',
                }}
              />
            )}

          </div>{/* end track */}

        </div>{/* end meter row */}

      </div>{/* end center col */}

      {/* ── FAR RIGHT: Activity Island & Up Next Task Bar Capsule ── */}
      {isTaskBarVisible && <HUDTaskBar variant="header" className="shrink-0 z-10" />}
    </div>
  )
}
