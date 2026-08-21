import React from 'react'
import { getAssetUrl } from '@/lib/assets'

// ─────────────────────────────────────────────────────────────────────────────
// HUDPageLoader
// Full-screen minimal loading state for TanStack Router's defaultPendingComponent.
// Displays a muted, subtly pulsing logo in the center of the dark benthic canvas.
// ─────────────────────────────────────────────────────────────────────────────

export function HUDPageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030708]/65 backdrop-blur-sm animate-in fade-in duration-200 transition-opacity"
      role="status"
      aria-label="Loading"
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-benthic-vignette opacity-50 pointer-events-none" />

      {/* Muted Logo with subtle pulse and gentle aura */}
      <div className="relative flex items-center justify-center">
        {/* Soft muted ambient glow */}
        <div
          className="absolute w-20 h-20 rounded-full bg-[#00c3ff]/10 blur-xl pointer-events-none"
          style={{ animation: 'hud-logo-glow 3s ease-in-out infinite' }}
        />

        {/* Faint subtle rotating outer ring */}
        <div
          className="absolute w-16 h-16 rounded-full border border-[#00c3ff]/15 border-t-[#00c3ff]/40 pointer-events-none"
          style={{ animation: 'hud-logo-spin 4s linear infinite' }}
        />

        {/* Muted Emblem Logo */}
        <img
          src={getAssetUrl('/images/order_emblem.png')}
          alt="Loading"
          className="relative z-10 w-9 h-9 object-contain opacity-60 transition-opacity duration-300"
          style={{ animation: 'hud-logo-breathe 3s ease-in-out infinite' }}
        />
      </div>

      {/* SSR-safe keyframes */}
      <style>{`
        @keyframes hud-logo-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hud-logo-breathe {
          0%, 100% { transform: scale(0.96); opacity: 0.45; }
          50%      { transform: scale(1.04); opacity: 0.75; }
        }
        @keyframes hud-logo-glow {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50%      { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
