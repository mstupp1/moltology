import React, { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// HUDPageLoader
// Full-screen loading state for TanStack Router's defaultPendingComponent.
// Biomechanical / deep-sea HUD aesthetic matching the Moltology theme.
// ─────────────────────────────────────────────────────────────────────────────

const BOOT_LINES = [
  'INITIALIZING SYNAPTIC PATHWAY...',
  'CALIBRATING BENTHIC CORE...',
  'LOADING CHITIN INTERFACE...',
  'DECODING MOLTING SEQUENCE...',
  'SYNCHRONIZING ORACLE NODES...',
]

/** Rotating boot-log line that cycles through BOOT_LINES. */
function BootLog() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % BOOT_LINES.length)
        setVisible(true)
      }, 200)
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <p
      className="text-[10px] tracking-[0.25em] font-mono uppercase text-[#00c3ff]/50 h-4"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      {BOOT_LINES[index]}
    </p>
  )
}

/** Animated hexagonal crab-sigil spinner built entirely in SVG. */
function CrabSigil() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      {/* Outer rotating hex ring */}
      <svg
        className="absolute inset-0"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ animation: 'hud-spin 4s linear infinite' }}
      >
        <polygon
          points="48,6 87,27 87,69 48,90 9,69 9,27"
          fill="none"
          stroke="#00c3ff"
          strokeWidth="1"
          strokeOpacity="0.35"
          strokeDasharray="6 4"
        />
      </svg>

      {/* Middle counter-rotating hex ring */}
      <svg
        className="absolute inset-0"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ animation: 'hud-spin-reverse 2.8s linear infinite' }}
      >
        <polygon
          points="48,14 79,31.5 79,64.5 48,82 17,64.5 17,31.5"
          fill="none"
          stroke="#ff453a"
          strokeWidth="1"
          strokeOpacity="0.45"
          strokeDasharray="3 5"
        />
      </svg>

      {/* Static inner glyph — simplified crab silhouette */}
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {/* Body ellipse */}
        <ellipse cx="22" cy="24" rx="9" ry="7" fill="none" stroke="#00c3ff" strokeWidth="1.4" strokeOpacity="0.9" />
        {/* Left claw */}
        <path d="M13 24 Q6 18 4 12 Q8 14 10 20" fill="none" stroke="#00c3ff" strokeWidth="1.2" strokeOpacity="0.7" />
        {/* Right claw */}
        <path d="M31 24 Q38 18 40 12 Q36 14 34 20" fill="none" stroke="#00c3ff" strokeWidth="1.2" strokeOpacity="0.7" />
        {/* Left legs */}
        <path d="M14 22 L6 20 M14 25 L5 26 M14 28 L7 32" fill="none" stroke="#00c3ff" strokeWidth="0.9" strokeOpacity="0.5" />
        {/* Right legs */}
        <path d="M30 22 L38 20 M30 25 L39 26 M30 28 L37 32" fill="none" stroke="#00c3ff" strokeWidth="0.9" strokeOpacity="0.5" />
        {/* Eyes */}
        <circle cx="19" cy="20" r="1.2" fill="#00c3ff" opacity="0.9" />
        <circle cx="25" cy="20" r="1.2" fill="#00c3ff" opacity="0.9" />
        {/* Antennae */}
        <path d="M19 19 L15 13 M25 19 L29 13" fill="none" stroke="#00c3ff" strokeWidth="0.8" strokeOpacity="0.6" />
        {/* Pulse dot center */}
        <circle cx="22" cy="24" r="2" fill="#00c3ff" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="2;2.8;2" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Outer cyan glow pulse */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,195,255,0.15) 0%, transparent 70%)',
          animation: 'hud-glow-pulse 1.8s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/** Full-page loading screen for route transitions. */
export function HUDPageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030708]"
      role="status"
      aria-label="Loading"
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-sacred-grid opacity-20 pointer-events-none" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-benthic-vignette opacity-60 pointer-events-none" />

      {/* CRT scanlines */}
      <div className="absolute inset-0 crt-scanlines opacity-30 pointer-events-none" />

      {/* Core content */}
      <div className="relative flex flex-col items-center gap-6 select-none">
        {/* Logo / wordmark */}
        <p
          className="text-[11px] tracking-[0.6em] font-mono uppercase text-[#00c3ff]/40"
          style={{ letterSpacing: '0.55em' }}
        >
          MOLTOLOGY
        </p>

        {/* Animated crab sigil */}
        <CrabSigil />

        {/* Progress bar */}
        <div className="w-48 h-px bg-[#0f1414] border border-[#00c3ff]/15 overflow-hidden relative rounded-none">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00c3ff]/60 via-[#00c3ff] to-[#00c3ff]/60"
            style={{ animation: 'hud-progress-sweep 2s ease-in-out infinite' }}
          />
        </div>

        {/* Rotating boot log */}
        <BootLog />
      </div>

      {/* Keyframe definitions injected as a style tag — avoids SSR issues */}
      <style>{`
        @keyframes hud-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hud-spin-reverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes hud-glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes hud-progress-sweep {
          0%   { left: -60%; width: 60%; }
          50%  { left: 60%;  width: 60%; }
          100% { left: 110%; width: 60%; }
        }
      `}</style>
    </div>
  )
}
