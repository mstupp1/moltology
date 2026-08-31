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
      className="pointer-events-auto mx-3 mb-2 sm:mx-4 md:mx-auto md:mb-4 md:w-full md:max-w-md rounded-sm border border-[#00c3ff]/35 bg-[#0a1212] shadow-[0_0_24px_rgba(0,195,255,0.12)]"
    >
      <div className="flex items-start gap-3 p-3 sm:p-3.5">
        <div className="mt-0.5 shrink-0 text-[#00c3ff]">
          <Download className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-grotesk text-xs font-bold uppercase tracking-widest text-[#dfe3e3]">
            Install Command Hub
          </p>
          <p className="mt-0.5 text-xs text-[#839493] font-sans leading-snug">
            Keep the benthic shell on your home screen for faster rites and quieter focus.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void install()
              }}
              className="px-3 py-1.5 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-[10px] uppercase tracking-widest chamfer-corner transition-colors"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="px-3 py-1.5 text-[#839493] hover:text-[#dfe3e3] font-grotesk font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss install invitation"
          className="shrink-0 p-1 text-[#839493] hover:text-[#dfe3e3] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
