import React from 'react'
import { HUDTaskBar } from './HUDTaskBar'
import { getAssetUrl } from '@/lib/assets'

export interface HUDProgressBarProps {
  stage?: number
  className?: string
  showTaskBar?: boolean
  /** @deprecated Use showTaskBar */
  showClock?: boolean
}

const PROGRESS = 0.68

export const HUDProgressBar: React.FC<HUDProgressBarProps> = ({
  stage = 1,
  className = '',
  showTaskBar,
  showClock = true,
}) => {
  const isTaskBarVisible = showTaskBar !== undefined ? showTaskBar : showClock
  // Segment tick count for the bar
  const TICK_COUNT = 16
  const nextStage = Math.min(stage + 1, 4)
  const isMaxStage = stage >= 4

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 font-sans select-none min-w-0 ${className}`}>
      {/* ── CENTER: Full-Space Conversion Bar with Compact Top Level Readouts ── */}
      <div className="flex-1 min-w-0 z-10 flex flex-col justify-center gap-0.5 px-0.5 sm:px-1">
        {/* Compact Level Readouts on Top */}
        <div className="flex items-center justify-between px-0.5 select-none leading-none">
          {/* Current Level */}
          <div
            className="flex items-baseline gap-1"
            title={`Current Clearance Level ${stage}`}
            aria-label={`Level ${stage} Badge`}
          >
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#839493] tracking-wider uppercase">LVL</span>
            <span className="text-[10px] sm:text-xs font-bold text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.7)] leading-none">
              {stage}
            </span>
          </div>

          {/* Next Level / Apex Target */}
          {!isMaxStage ? (
            <div
              className="flex items-baseline gap-1"
              title={`Next Ascension Clearance: Level ${nextStage}`}
              aria-label={`Next Level ${nextStage} Badge`}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#b58060] tracking-wider uppercase">LVL</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#ffb076] drop-shadow-[0_0_6px_rgba(255,140,66,0.7)] leading-none">
                {nextStage}
              </span>
            </div>
          ) : (
            <div
              className="flex items-baseline"
              title="Apex Carcinization Level Reached"
              aria-label="Apex Level Badge"
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
              className="absolute top-0 left-0 h-full rounded-full overflow-hidden transition-all duration-700"
              style={{
                width: `${PROGRESS * 100}%`,
                background: 'linear-gradient(90deg, #003a55 0%, #006f85 20%, #00c3ff 45%, #ff6b35 72%, #ff2a1a 85%, #cc0000 100%)',
                boxShadow: '0 0 10px rgba(255,69,58,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  backgroundSize: '60% 100%',
                  animation: 'shimmerSweep 2.2s ease-in-out infinite',
                }}
              />
              {/* Top specular stripe */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-b from-white/30 to-transparent" />
            </div>

            {/* ── TICK MARKS ── */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {Array.from({ length: TICK_COUNT - 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${((i + 1) / TICK_COUNT) * 100}%`,
                    width: '1px',
                    background: i % 4 === 3 ? 'rgba(0,195,255,0.35)' : 'rgba(0,195,255,0.08)',
                  }}
                />
              ))}
            </div>

            {/* ── GLOWING PROGRESS EDGE ── */}
            <div
              className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `calc(${PROGRESS * 100}% - 1.5px)`,
                width: '3px',
                background: 'white',
                boxShadow: '0 0 8px 2px rgba(255,255,255,0.9), 0 0 14px 4px rgba(255,100,50,0.8)',
                borderRadius: '1px',
              }}
            />

            {/* ── CRAB CLAW INDICATOR ── */}
            <div
              className="absolute top-1/2 pointer-events-none z-20 w-6 h-6 sm:w-8 sm:h-8"
              style={{
                left: `calc(${PROGRESS * 100}% - 2px)`,
                transform: 'translateY(-50%) translateX(0)',
              }}
            >
              <img
                src={getAssetUrl('/images/crab_claw.png')}
                alt="Exoshell Claw"
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255,80,30,0.95)) drop-shadow(0 0 12px rgba(255,80,30,0.6)) brightness(0.95) saturate(1.4)',
                }}
                draggable={false}
              />
            </div>

          </div>{/* end track */}

        </div>{/* end meter row */}

      </div>{/* end center col */}

      {/* ── FAR RIGHT: Activity Island & Up Next Task Bar Capsule ── */}
      {isTaskBarVisible && <HUDTaskBar variant="header" className="shrink-0 z-10" />}
    </div>
  )
}
