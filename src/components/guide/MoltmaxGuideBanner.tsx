/**
 * ============================================================================
 * MOLTMAXXING GUIDE TOP NOTIFICATION RIBBON
 * Sticky, dismissible, non-intrusive banner for high-visibility top-of-funnel lead capture.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, X, BookOpen } from 'lucide-react'

export interface MoltmaxGuideBannerProps {
  onOpenGuideModal: () => void
}

const STORAGE_KEY = 'moltmax_guide_banner_dismissed_v1'

export const MoltmaxGuideBanner: React.FC<MoltmaxGuideBannerProps> = ({
  onOpenGuideModal,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) {
        setIsVisible(true)
      }
    } catch {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
  }

  if (!isVisible) return null

  return (
    <div
      onClick={onOpenGuideModal}
      className="relative z-40 w-full bg-gradient-to-r from-[#020914] via-[#041a2e] to-[#020914] border-b border-[#00c3ff]/30 px-4 py-2 text-xs font-mono text-[#dfe3e3] cursor-pointer hover:bg-[#06223d] transition-colors group"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00c3ff]/20 text-[#00c3ff] font-bold text-[10px] uppercase border border-[#00c3ff]/40">
            <Sparkles className="w-3 h-3 text-[#ffd700]" />
            NEW PROTOCOL
          </span>
          <span className="text-white font-grotesk font-bold uppercase tracking-tight">
            The 2026 Moltmaxxing Field Manual
          </span>
          <span className="hidden md:inline text-[#839493]">
            — 38-Page Carcinization &amp; Ecdysis Guide
          </span>
          <span className="inline-flex items-center gap-1.5 ml-1">
            <span className="line-through text-[#ff453a] text-[11px] font-bold">$149</span>
            <span className="text-[#00ffcc] font-bold font-grotesk text-[11px] uppercase bg-[#00ffcc]/10 px-1.5 py-0.2 rounded border border-[#00ffcc]/30">
              FREE TODAY
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00c3ff] group-hover:text-white uppercase tracking-wider transition-colors">
            <span>CLAIM FREE COPY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>

          <button
            onClick={handleDismiss}
            className="p-1 text-[#839493] hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
