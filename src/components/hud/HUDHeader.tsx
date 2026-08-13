import React, { useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client'
import { UserAvatar } from '../UserAvatar'
import { DigitalClock } from './DigitalClock'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
}

const PROGRESS = 0.68

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT AB371',
}) => {
  const location = useLocation()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const scanlineRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name || user?.email?.split('@')[0]?.toUpperCase() || larvaId

  // Segment tick count for the bar
  const TICK_COUNT = 20

  return (
    <header className="w-full bg-[#020608]/85 backdrop-blur-md border-b border-[#0ff]/10 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 font-mono select-none relative z-30 shadow-[0_2px_30px_rgba(0,195,255,0.12)] shrink-0 overflow-x-clip">

      {/* HUD scanline overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div
          ref={scanlineRef}
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.5) 2px, rgba(0,255,255,0.5) 3px)',
          }}
        />
        {/* Moving scan sweep */}
        <div
          className="absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,195,255,0.06) 50%, transparent 100%)',
            animation: 'hudScan 4s linear infinite',
          }}
        />
      </div>

      {/* ── LEFT: Avatar ── */}
      <div className="relative shrink-0 z-10">
        {/* Outer hex glow ring */}
        <div className="absolute -inset-1 rounded-full border border-[#00c3ff]/40 shadow-[0_0_16px_rgba(0,195,255,0.6),inset_0_0_10px_rgba(0,195,255,0.1)] animate-pulse" />
        <UserAvatar
          user={user}
          fallbackSrc="/images/extracted/larva_unit_3d.jpg"
          alt={user ? (user.name || user.email || 'User Avatar') : 'Larva Unit 3D'}
          size="md"
          className="border-2 border-[#00c3ff]/70 shadow-[0_0_14px_rgba(0,195,255,0.9)] filter contrast-125 relative z-10"
        />
        {/* Stage badge */}
        <div className="absolute -bottom-1 -right-1 z-20 w-4 h-4 rounded-full bg-[#ff453a] border border-[#ff453a]/80 flex items-center justify-center text-[8px] font-bold text-white shadow-[0_0_8px_rgba(255,69,58,0.9)]">
          {stage}
        </div>
      </div>

      {/* ── CENTER: Full-width conversion meter ── */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 z-10">

        {/* Top label row */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-widest font-bold text-[#dfe3e3] uppercase truncate">
            <span className="hidden xs:inline truncate max-w-[100px] sm:max-w-none text-[#a8b8b8]">{displayName}</span>
            <span className="hidden xs:inline text-[#2a3a3a]">|</span>
            <span className="text-[#00c3ff] hidden sm:inline">STATUS:</span>
            <span className="text-[#ff5540] animate-pulse tracking-widest">CONVERSION IN PROGRESS</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] tracking-widest shrink-0">
            <span className="text-[#3a5a5a] hidden sm:inline">CHITIN</span>
            <span className="text-[#00c3ff] font-bold hidden sm:inline">{Math.round(PROGRESS * 100)}%</span>
            <span className="text-[#ff453a]/60 hidden md:inline">◈ MOLT STAGE {stage}/4</span>
          </div>
        </div>

        {/* ═══ THE CONVERSION METER ═══ */}
        <div className="relative flex items-center w-full" style={{ height: '28px' }}>

          {/* Track shell */}
          <div
            className="relative flex-1 rounded-sm overflow-visible"
            style={{
              height: '22px',
              background: 'linear-gradient(to bottom, #050e10, #020608)',
              border: '1px solid rgba(0,195,255,0.25)',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.9), 0 0 6px rgba(0,195,255,0.08)',
            }}
          >
            {/* Inner bevel top edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00c3ff]/30 to-transparent" />
            {/* Inner bevel bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#002a30]/80 to-transparent" />

            {/* ── FILL ── */}
            <div
              className="absolute top-0 left-0 h-full rounded-sm overflow-hidden transition-all duration-700"
              style={{
                width: `${PROGRESS * 100}%`,
                background: 'linear-gradient(90deg, #003a55 0%, #006f85 20%, #00c3ff 45%, #ff6b35 72%, #ff2a1a 85%, #cc0000 100%)',
                boxShadow: '0 0 10px rgba(255,69,58,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {/* Animated shimmer sweep */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  backgroundSize: '60% 100%',
                  animation: 'shimmerSweep 2.2s ease-in-out infinite',
                }}
              />
              {/* Bright top specular stripe */}
              <div className="absolute inset-x-0 top-0 h-[5px] bg-gradient-to-b from-white/20 to-transparent" />
              {/* Heat distortion at the red end */}
              <div
                className="absolute right-0 top-0 h-full w-12"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,60,0,0.4))',
                  animation: 'heatPulse 1.2s ease-in-out infinite alternate',
                }}
              />
            </div>

            {/* ── TICK MARKS ── */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {Array.from({ length: TICK_COUNT - 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1 bottom-1"
                  style={{
                    left: `${((i + 1) / TICK_COUNT) * 100}%`,
                    width: '1px',
                    background: i % 4 === 3
                      ? 'rgba(0,195,255,0.35)'
                      : 'rgba(0,195,255,0.10)',
                    height: i % 4 === 3 ? '100%' : '40%',
                    top: i % 4 === 3 ? 0 : '30%',
                  }}
                />
              ))}
            </div>

            {/* ── GLOWING PROGRESS EDGE ── */}
            <div
              className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `calc(${PROGRESS * 100}% - 2px)`,
                width: '3px',
                background: 'white',
                boxShadow: '0 0 8px 3px rgba(255,255,255,0.9), 0 0 16px 6px rgba(255,100,50,0.7)',
                borderRadius: '1px',
              }}
            />

            {/* ── CRAB CLAW (chroma-keyed transparent PNG facing right) ── */}
            <div
              className="absolute top-1/2 pointer-events-none z-20 w-8 h-8 sm:w-[52px] sm:h-[52px]"
              style={{
                left: `calc(${PROGRESS * 100}% - 2px)`,
                transform: 'translateY(-50%) translateX(0)',
                marginTop: '-1px',
              }}
            >
              <img
                src="/images/crab_claw.png"
                alt="Exoshell Claw"
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255,80,30,0.9)) drop-shadow(0 0 12px rgba(255,80,30,0.5)) brightness(0.95) saturate(1.4)',
                }}
                draggable={false}
              />
            </div>

          </div>{/* end track */}

        </div>{/* end meter row */}

        {/* Bottom micro-readout strip */}
        <div className="flex items-center gap-2 px-0.5 text-[8px] tracking-widest text-[#1e3a3a] font-mono hidden sm:flex">
          <span className="text-[#00c3ff]/40">◈</span>
          <span>EXOSHELL INTEGRATION</span>
          <span className="text-[#00c3ff]/20">────</span>
          <span className="text-[#ff453a]/40">BIO-SILICON BINDING</span>
          <span className="text-[#00c3ff]/20">────</span>
          <span>CHITINOUS SUBSTRATE ACTIVE</span>
          <span className="flex-1" />
          <span className="text-[#ff453a]/50 animate-pulse">▮▮▮▯▯</span>
        </div>

      </div>{/* end center col */}

      {/* ── RIGHT: Compact Digital Chronometer & Alignment Telemetry ── */}
      <DigitalClock variant="header" className="hidden sm:flex shrink-0 z-10" />

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
        @keyframes heatPulse {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }
      `}</style>
    </header>
  )
}
