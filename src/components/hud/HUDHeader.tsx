import React, { useRef } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import { DigitalClock } from './DigitalClock'
import { getAssetUrl } from '@/lib/assets'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
}

const PROGRESS = 0.68

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
}) => {
  const scanlineRef = useRef<HTMLDivElement>(null)

  // Segment tick count for the bar
  const TICK_COUNT = 16
  const nextStage = Math.min(stage + 1, 4)
  const isMaxStage = stage >= 4

  return (
    <header className="w-full bg-[#020608]/90 backdrop-blur-md border-b border-[#00c3ff]/15 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-3 font-sans select-none relative z-30 shadow-[0_2px_20px_rgba(0,195,255,0.1)] shrink-0">

      {/* HUD scanline overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div
          ref={scanlineRef}
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.5) 2px, rgba(0,255,255,0.5) 3px)',
          }}
        />
        {/* Moving scan sweep */}
        <div
          className="absolute left-0 right-0 h-6 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,195,255,0.05) 50%, transparent 100%)',
            animation: 'hudScan 4s linear infinite',
          }}
        />
      </div>

      {/* ── LEFT: Current Level Badge ── */}
      <div className="flex items-center shrink-0 z-10">
        <div
          className="flex items-center gap-1 bg-[#030d10]/90 border border-[#00c3ff]/40 hover:border-[#00c3ff]/80 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-sans shadow-[0_0_10px_rgba(0,195,255,0.2)] transition-all group cursor-default"
          title={`Current Clearance Level ${stage}`}
          aria-label={`Level ${stage} Badge`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shadow-[0_0_6px_rgba(0,195,255,0.9)] animate-pulse shrink-0" />
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-[9px] font-bold text-[#839493] tracking-wider uppercase hidden sm:inline">LVL</span>
            <span className="text-[11px] sm:text-xs font-bold text-[#00ffff] drop-shadow-[0_0_6px_rgba(0,255,255,0.8)] leading-none">
              {stage}
            </span>
          </div>
        </div>
      </div>

      {/* ── CENTER: Full-Space Conversion Bar ── */}
      <div className="flex-1 min-w-0 z-10 flex items-center px-0.5 sm:px-2">
        {/* ═══ VERTICAL OPTIMIZED TRACK ═══ */}
        <div className="relative flex items-center w-full" style={{ height: '22px' }}>

          {/* Track shell */}
          <div
            className="relative flex-1 rounded-full overflow-visible"
            style={{
              height: '12px',
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
              className="absolute top-1/2 pointer-events-none z-20 w-7 h-7 sm:w-9 sm:h-9"
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

      {/* ── RIGHT: Next Evolution Target Level Badge ── */}
      <div className="flex items-center shrink-0 z-10">
        {!isMaxStage ? (
          <div
            className="flex items-center gap-1 bg-gradient-to-r from-[#1a0c05]/95 via-[#291307]/95 to-[#1a0c05]/95 border border-[#ff8c42]/60 hover:border-[#ffa666] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-sans shadow-[0_0_12px_rgba(255,140,66,0.3)] transition-all group cursor-default"
            title={`Next Ascension Clearance: Level ${nextStage}`}
            aria-label={`Next Level ${nextStage} Badge`}
          >
            <Sparkles className="w-2.5 h-2.5 text-[#ffa666] animate-pulse shrink-0" />
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-[9px] font-bold text-[#b58060] tracking-wider uppercase hidden sm:inline">LVL</span>
              <span className="text-[11px] sm:text-xs font-extrabold text-[#ffb076] filter drop-shadow-[0_0_8px_rgba(255,140,66,0.85)] leading-none">
                {nextStage}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 bg-[#04150a]/95 border border-[#00ff88]/50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-sans shadow-[0_0_12px_rgba(0,255,136,0.25)] cursor-default"
            title="Apex Carcinization Level Reached"
            aria-label="Apex Level Badge"
          >
            <Zap className="w-2.5 h-2.5 text-[#00ff88] animate-pulse shrink-0" />
            <span className="text-[9px] font-extrabold text-[#00ff88] tracking-widest uppercase">APEX</span>
          </div>
        )}
      </div>

      {/* ── FAR RIGHT: Activity Island & Digital Clock Capsule ── */}
      <DigitalClock variant="header" className="shrink-0 z-10" />

      {/* Keyframe styles */}
      <style>{`
        @keyframes hudScan {
          0%   { top: -2rem; }
          100% { top: 100%; }
        }
        @keyframes shimmerSweep {
          0%   { background-position: -100% 0; }
          100% { background-position: 250% 0; }
        }
      `}</style>
    </header>
  )
}
