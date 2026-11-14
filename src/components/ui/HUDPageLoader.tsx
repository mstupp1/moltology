import React from 'react'
import { GlowEmblem } from '@/components/ui/GlowEmblem'

// ─────────────────────────────────────────────────────────────────────────────
// HUDPageLoader
// Full-screen loading state for TanStack Router's defaultPendingComponent.
// The page behind dims and blurs; the emblem fades in, glowing, and a soft band of
// light passes across it every couple of seconds while its glow slowly swells.
// ─────────────────────────────────────────────────────────────────────────────

export function HUDPageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/65 backdrop-blur-sm animate-in fade-in duration-200"
      role="status"
      aria-label="Loading"
    >
      <div className="hud-page-loader-emblem">
        <GlowEmblem size={40} label="Loading" breathe markClassName="hud-page-loader-sheen" />
      </div>

      {/* SSR-safe keyframes */}
      <style>{`
        .hud-page-loader-emblem {
          opacity: 0;
          animation: hud-loader-in 300ms ease-out 80ms forwards;
        }
        .hud-page-loader-sheen {
          -webkit-mask-image: linear-gradient(105deg, rgba(0,0,0,.6) 42%, #000 50%, rgba(0,0,0,.6) 58%);
          mask-image: linear-gradient(105deg, rgba(0,0,0,.6) 42%, #000 50%, rgba(0,0,0,.6) 58%);
          -webkit-mask-size: 250% 100%;
          mask-size: 250% 100%;
          -webkit-mask-position: 100% 0;
          mask-position: 100% 0;
          animation: hud-loader-sheen 2.4s cubic-bezier(.4, 0, .2, 1) 300ms infinite;
        }
        @keyframes hud-loader-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes hud-loader-sheen {
          0%        { -webkit-mask-position: 100% 0; mask-position: 100% 0; }
          60%, 100% { -webkit-mask-position: 0% 0; mask-position: 0% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hud-page-loader-emblem { animation-duration: 1ms; transform: none; }
          .hud-page-loader-sheen { animation: none; }
        }
      `}</style>
    </div>
  )
}
