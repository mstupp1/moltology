/**
 * ============================================================================
 * MOLTMAXXING GUIDE FLOATING HUD PILL
 * Non-intrusive bottom-right floating trigger for top-of-funnel guide capture.
 * If dismissed, gracefully reappears after a gentle cooldown (e.g. 90 seconds)
 * to remain noticeable without being overly intrusive.
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, X, Sparkles, ArrowRight, Download } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'

export interface MoltmaxGuideFloatingPillProps {
  onOpenGuideModal: () => void
  cooldownSeconds?: number
}

const STORAGE_KEY_DISMISSED_AT = 'moltmax_guide_pill_dismissed_at_ts'
const DEFAULT_COOLDOWN_MS = 90_000 // 90 seconds gentle reappearance cooldown

export const MoltmaxGuideFloatingPill: React.FC<MoltmaxGuideFloatingPillProps> = ({
  onOpenGuideModal,
  cooldownSeconds,
}) => {
  const cooldownMs = cooldownSeconds ? cooldownSeconds * 1000 : DEFAULT_COOLDOWN_MS
  const [isDismissed, setIsDismissed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const dismissedAtStr = sessionStorage.getItem(STORAGE_KEY_DISMISSED_AT)
      if (dismissedAtStr) {
        const dismissedAt = parseInt(dismissedAtStr, 10)
        const elapsed = Date.now() - dismissedAt
        if (elapsed < cooldownMs) {
          setIsDismissed(true)
          const remaining = cooldownMs - elapsed
          timerRef.current = setTimeout(() => {
            setIsDismissed(false)
            sessionStorage.removeItem(STORAGE_KEY_DISMISSED_AT)
          }, remaining)
        } else {
          sessionStorage.removeItem(STORAGE_KEY_DISMISSED_AT)
        }
      }
    } catch {
      // ignore
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cooldownMs])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED_AT, String(Date.now()))
    } catch {
      // ignore
    }

    // Schedule gentle return after cooldown
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsDismissed(false)
      try {
        sessionStorage.removeItem(STORAGE_KEY_DISMISSED_AT)
      } catch {
        // ignore
      }
    }, cooldownMs)
  }

  if (isDismissed) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
      <div
        onClick={onOpenGuideModal}
        className="relative group bg-[#040914]/90 hover:bg-[#061224] border border-[#00c3ff]/40 hover:border-[#00c3ff] rounded-xl p-3 shadow-[0_0_30px_rgba(0,195,255,0.25)] backdrop-blur-md cursor-pointer transition-all flex items-center gap-3.5 pr-8"
      >
        {/* Glowing Indicator Pulse */}
        <span className="absolute -top-1 -left-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
        </span>

        {/* Thumbnail Image */}
        <div className="relative shrink-0 w-12 h-14 rounded-md overflow-hidden border border-white/20 shadow-md">
          <img
            src={getAssetUrl('/images/moltmax_guide_3d_mockup.jpg')}
            alt="Moltmaxxing Guide 3D Thumbnail"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Text Content */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-sans font-bold text-[#ffd700] uppercase tracking-wider">
              FREE PROTOCOL
            </span>
            <span className="line-through text-[#ff453a] text-[10px] font-sans font-bold">
              $149
            </span>
          </div>

          <h4 className="text-xs font-grotesk font-black text-white uppercase tracking-tight truncate group-hover:text-[#00c3ff] transition-colors">
            2026 Moltmax Field Manual
          </h4>

          <p className="text-[10px] text-[#839493] font-sans flex items-center gap-1">
            <span>Instant Download</span>
            <ArrowRight className="w-2.5 h-2.5 text-[#00ffcc] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-[#839493] hover:text-white rounded transition-colors"
          aria-label="Hide guide pill"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
