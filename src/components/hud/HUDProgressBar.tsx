import React, { useMemo } from 'react'
import { HUDTaskBar } from './HUDTaskBar'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { calculateProgression } from '@/lib/progression'

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

  // Use propStage only if explicitly passed (e.g. testing / override), otherwise derive naturally from XP
  const effectiveStage = propStage !== undefined ? propStage : (propXp !== undefined ? undefined : alignment.stage)
  const effectiveXp = propXp !== undefined ? propXp : alignment.xp

  const progression = useMemo(() => {
    return calculateProgression(effectiveXp, effectiveStage)
  }, [effectiveXp, effectiveStage])

  const isTaskBarVisible = showTaskBar !== undefined ? showTaskBar : showClock
  const nextStage = Math.min(progression.stage + 1, 4)
  const isMaxStage = progression.isMaxStage
  const progressRatio = progression.progressRatio
  const fillPercent = isMaxStage ? 100 : Math.round(progressRatio * 100)

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 font-sans select-none min-w-0 ${className}`}>
      {/* ── CENTER: Full-Space Conversion Bar with Compact Top Level Readouts ── */}
      <div className="flex-1 min-w-0 z-10 flex flex-col justify-center gap-0.5 px-0.5 sm:px-1">
        {/* Compact Level Readouts on Top */}
        <div className="flex items-center justify-between px-0.5 select-none leading-none">
          {/* Current Stage */}
          <div
            className="flex items-baseline gap-1"
            title={`Current Clearance Stage ${progression.stage}: ${progression.stageTitle}`}
            aria-label={`Stage ${progression.stage} Badge`}
          >
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#839493] tracking-wider uppercase">STAGE</span>
            <span className="text-[10px] sm:text-xs font-bold text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.7)] leading-none">
              {progression.stage}
            </span>
          </div>

          {/* Telemetry Center: Sub-Stage & XP Progress */}
          <div
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#010a0d]/70 border border-cyan-900/30 text-[9px] font-mono tracking-wider"
            title={`Telemetry: ${progression.subStage.title} · ${effectiveXp.toLocaleString()} Lifetime XP`}
          >
            <span className="text-cyan-400 font-bold">{progression.subStage.code}</span>
            <span className="text-cyan-800 hidden xs:inline">·</span>
            {!isMaxStage ? (
              <span className="text-[#839493] hidden xs:inline">
                <span className="text-[#dfe3e3] font-semibold">{progression.xpIntoStage.toLocaleString()}</span>
                <span className="text-cyan-800">/</span>
                <span>{progression.xpNeededForNextStage.toLocaleString()} XP</span>
              </span>
            ) : (
              <span className="text-[#00ff88] font-bold tracking-widest hidden xs:inline">
                {effectiveXp.toLocaleString()} XP
              </span>
            )}
          </div>

          {/* Next Stage / Apex Target */}
          {!isMaxStage ? (
            <div
              className="flex items-baseline gap-1"
              title={`Next Ascension Clearance: Stage ${nextStage}`}
              aria-label={`Next Stage ${nextStage} Badge`}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#b58060] tracking-wider uppercase">STAGE</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#ffb076] drop-shadow-[0_0_6px_rgba(255,140,66,0.7)] leading-none">
                {nextStage}
              </span>
            </div>
          ) : (
            <div
              className="flex items-baseline"
              title="Apex Carcinization Stage Reached"
              aria-label="Apex Stage Badge"
            >
              <span className="text-[9px] sm:text-[10px] font-extrabold text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.6)] tracking-widest uppercase leading-none">
                APEX
              </span>
            </div>
          )}
        </div>

        {/* ═══ VERTICAL OPTIMIZED TRACK ═══ */}
        <div className="relative flex items-center w-full" style={{ height: '16px' }}>

          {/* Track shell */}
          <div
            className="relative flex-1 rounded-full overflow-visible"
            style={{
              height: '10px',
              background: 'linear-gradient(to bottom, #040b0d, #010405)',
              border: '1px solid rgba(0,195,255,0.3)',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.95), 0 0 8px rgba(0,195,255,0.1)',
            }}
          >
            {/* ── FILL ── */}
            <div
              className="absolute top-0 left-0 h-full rounded-full overflow-hidden transition-all duration-500 ease-out"
              style={{
                width: `${fillPercent}%`,
                background: 'linear-gradient(90deg, #003a55 0%, #006f85 20%, #00c3ff 45%, #ff6b35 72%, #ff2a1a 85%, #cc0000 100%)',
                boxShadow: '0 0 10px rgba(255,69,58,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              {/* Shimmer sweep - Hardware Accelerated GPU Transform */}
              <div
                className="absolute inset-y-0 w-1/2 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                  animation: 'shimmerSweep 2.2s ease-in-out infinite',
                  willChange: 'transform',
                }}
              />
              {/* Top specular stripe */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            </div>

            {/* ── GLOWING PROGRESS EDGE ── */}
            {fillPercent > 0 && (
              <div
                className="absolute top-0 h-full pointer-events-none transition-all duration-500 ease-out"
                style={{
                  left: `calc(${fillPercent}% - 1.5px)`,
                  width: '3px',
                  background: 'white',
                  boxShadow: '0 0 8px 2px rgba(255,255,255,0.9), 0 0 14px 4px rgba(255,100,50,0.8)',
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
