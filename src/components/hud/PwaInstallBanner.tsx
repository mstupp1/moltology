import React from 'react'
import { Download, X } from 'lucide-react'
import { usePwaInstall } from '@/hooks/usePwaInstall'

/**
 * Soft guest + member install invitation for the Command Hub surface.
 * Hidden once installed, dismissed, or when the browser cannot prompt.
 */
export function PwaInstallBanner() {
  const { showInstallBanner, dismissBanner, install } = usePwaInstall()

  if (!showInstallBanner) return null

  return (
    <div
      role="region"
      aria-label="Install Command Hub"
      className="pointer-events-auto mx-3 mb-2 sm:mx-4 md:mx-auto md:mb-4 md:w-full md:max-w-md rounded-card border border-line bg-surface-1 hud-sheen shadow-menu"
    >
      <div className="flex items-start gap-3 p-3 sm:p-3.5">
        <div className="mt-0.5 shrink-0 text-cyan-glow">
          <Download className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-grotesk text-xs font-bold uppercase tracking-[0.08em] text-ink">
            Install Command Hub
          </p>
          <p className="mt-0.5 text-xs text-ink-body font-sans leading-snug">
            Keep the benthic shell on your home screen for faster rites and quieter focus.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void install()
              }}
              className="px-3 py-1.5 min-h-8 rounded-control bg-cyan-glow hover:bg-cyan-hover text-abyss font-grotesk font-bold text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="px-3 py-1.5 min-h-8 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 font-grotesk font-bold text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss install invitation"
          className="shrink-0 p-1 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
