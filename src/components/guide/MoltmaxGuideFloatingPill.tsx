/**
 * ============================================================================
 * MOLTMAXXING GUIDE FLOATING HUD PILL
 * Non-intrusive bottom-right floating trigger for top-of-funnel guide capture.
 * Draws the eye with a slow light circling its border and a cover that hops
 * now and then (both off under reduced motion).
 * If dismissed, gracefully reappears after a gentle cooldown (e.g. 90 seconds)
 * to remain noticeable without being overly intrusive.
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import { X, ArrowRight } from 'lucide-react'
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

  const handleDismiss = () => {
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
    <div data-guide-pill className="guide-pill fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40">
      <div className="group relative">
        {/* Attention cue: a light that slowly circles the border */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#00c3ff]/25" aria-hidden="true">
          <div className="guide-pill-beam absolute -inset-[150%]" />
          <div className="absolute inset-[1.5px] rounded-[14.5px] bg-[#040914]/95 group-hover:bg-[#061224] transition-colors" />
        </div>

        {/* Cover peeks out above the card and gives a small hop every few seconds */}
        <img
          src={getAssetUrl('images/guide/moltmaxxing-cover-v2-sm.webp')}
          alt=""
          loading="lazy"
          decoding="async"
          width={48}
          height={72}
          className="guide-pill-book pointer-events-none absolute left-3 -top-4 w-12 h-[72px] rounded-md object-cover border border-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.6)] transition-transform"
        />

        <button
          type="button"
          onClick={onOpenGuideModal}
          className="relative flex items-center gap-3 pl-[72px] pr-10 py-3 sm:py-3.5 text-left rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00c3ff]"
          aria-label="Get the free Moltmaxxing Field Manual"
        >
          <span className="block min-w-0 space-y-0.5">
            <span className="block text-[10px] font-sans font-bold text-[#00ffcc] uppercase tracking-wider">
              Free PDF
            </span>
            <span className="block text-sm font-grotesk font-bold text-white leading-tight">
              Moltmaxxing Field Manual
            </span>
            <span className="hidden sm:block text-xs text-[#839493] font-sans">
              A daily plan for finishing what you start
            </span>
          </span>
          <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#00c3ff] text-[#020408] group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </button>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-1.5 right-1.5 p-1 text-[#839493] hover:text-white rounded transition-colors cursor-pointer"
          aria-label="Hide field manual offer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
