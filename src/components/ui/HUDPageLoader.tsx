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
      className="text-[10px] tracking-[0.25em] font-sans uppercase text-[#00c3ff]/50 h-4"
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
          strokeWidth="1.5"
          strokeDasharray="14 6"
          opacity="0.5"
        />
      </svg>

      {/* Inner static cyan ring */}
      <svg
        className="absolute inset-0"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ animation: 'hud-spin 8s linear infinite reverse' }}
      >
        <polygon
          points="48,16 78,32 78,64 48,80 18,64 18,32"
          fill="none"
          stroke="#00c3ff"
          strokeWidth="0.75"
          strokeDasharray="6 8"
          opacity="0.3"
        />
      </svg>

      {/* Center glowing crab icon */}
      <div
        className="relative z-10 text-[#00c3ff]"
        style={{ animation: 'hud-sigil-pulse 2.2s ease-in-out infinite' }}
      >
        {/* Crisp crab SVG */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          {/* Main carapace */}
          <ellipse
            cx="12"
            cy="13"
            rx="5.5"
            ry="4.5"
            fill="#00c3ff"
            fillOpacity="0.18"
            stroke="#00c3ff"
            strokeWidth="1.2"
          />
          {/* Carapace suture */}
          <line
            x1="12"
            y1="8.5"
            x2="12"
            y2="17.5"
            stroke="#00c3ff"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          {/* Left eyestalk */}
          <line x1="10" y1="8.5" x2="8.5" y2="6.5" stroke="#00c3ff" strokeWidth="1.2" />
          <circle cx="8.5" cy="6.5" r="1" fill="#00c3ff" />
          {/* Right eyestalk */}
          <line x1="14" y1="8.5" x2="15.5" y2="6.5" stroke="#00c3ff" strokeWidth="1.2" />
          <circle cx="15.5" cy="6.5" r="1" fill="#00c3ff" />
          {/* Left main claw */}
          <path
            d="M7 11.5 C5 9.5, 4 8, 4.5 6 C5 4, 7 4.5, 7.5 6.5 C7.8 7.5, 7.5 9, 8 10.5"
            stroke="#00c3ff"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Right main claw */}
          <path
            d="M17 11.5 C19 9.5, 20 8, 19.5 6 C19 4, 17 4.5, 16.5 6.5 C16.2 7.5, 16.5 9, 16 10.5"
            stroke="#00c3ff"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Left walking legs */}
          <path d="M6.5 13.5 C4.5 13.5, 3 15, 3.5 17" stroke="#00c3ff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M7 15 C5.5 16, 4 17.5, 4.5 19" stroke="#00c3ff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
          {/* Right walking legs */}
          <path d="M17.5 13.5 C19.5 13.5, 21 15, 20.5 17" stroke="#00c3ff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M17 15 C18.5 16, 20 17.5, 19.5 19" stroke="#00c3ff" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
        </svg>
      </div>

      {/* Ambient glow behind sigil */}
      <div
        className="absolute inset-2 rounded-full bg-[#00c3ff]/10 blur-md pointer-events-none"
        style={{ animation: 'hud-sigil-pulse 2.2s ease-in-out infinite' }}
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
          className="text-[11px] tracking-[0.6em] font-sans uppercase text-[#00c3ff]/40"
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
