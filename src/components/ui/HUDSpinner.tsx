import React from 'react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// HUDSpinner
// Inline loading indicator for async operations (data fetches, form submits).
// Matches the Moltology dark-HUD theme — hex frame + rotating arc.
// ─────────────────────────────────────────────────────────────────────────────

export type HUDSpinnerSize = 'xs' | 'sm' | 'md' | 'lg'
export type HUDSpinnerVariant = 'cyan' | 'crimson' | 'neutral'

export interface HUDSpinnerProps {
  size?: HUDSpinnerSize
  variant?: HUDSpinnerVariant
  label?: string
  className?: string
}

const SIZE_MAP: Record<HUDSpinnerSize, { px: number; stroke: number; gap: number }> = {
  xs: { px: 16, stroke: 1.5, gap: 2 },
  sm: { px: 24, stroke: 1.8, gap: 3 },
  md: { px: 36, stroke: 2,   gap: 4 },
  lg: { px: 56, stroke: 2.4, gap: 6 },
}

const VARIANT_MAP: Record<HUDSpinnerVariant, { primary: string; secondary: string; track: string }> = {
  cyan:    { primary: '#00c3ff', secondary: '#00c3ff66', track: '#00c3ff18' },
  crimson: { primary: '#ff453a', secondary: '#ff453a66', track: '#ff453a18' },
  neutral: { primary: '#8a9898', secondary: '#8a989866', track: '#8a989818' },
}

/**
 * Inline spinner for use inside buttons, cards, and data-loading areas.
 *
 * @example
 * // Basic usage
 * <HUDSpinner />
 *
 * @example
 * // Inside a button
 * <HudButton disabled>
 *   <HUDSpinner size="xs" variant="cyan" /> Transmuting...
 * </HudButton>
 *
 * @example
 * // With a label below (stack vertically with a wrapper)
 * <div className="flex flex-col items-center gap-2">
 *   <HUDSpinner size="lg" />
 *   <span className="text-xs text-[#00c3ff]/60">Fetching doctrine...</span>
 * </div>
 */
export function HUDSpinner({
  size = 'md',
  variant = 'cyan',
  label,
  className,
}: HUDSpinnerProps) {
  const { px, stroke, gap } = SIZE_MAP[size]
  const { primary, secondary, track } = VARIANT_MAP[variant]
  const r = (px - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const dashArray = `${circumference * 0.65} ${circumference * 0.35}`

  return (
    <span
      className={cn('inline-flex flex-col items-center justify-center', className)}
      role="status"
      aria-label={label ?? 'Loading'}
      style={{ gap }}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Background track ring */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
        />

        {/* Animated spinning arc */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke={`url(#hud-spinner-grad-${variant}-${size})`}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={dashArray}
          strokeDashoffset={0}
          style={{ animation: 'hud-spin 1.1s linear infinite', transformOrigin: `${px / 2}px ${px / 2}px` }}
        />

        {/* Gradient definition for the arc */}
        <defs>
          <linearGradient
            id={`hud-spinner-grad-${variant}-${size}`}
            gradientUnits="userSpaceOnUse"
            x1={px / 2}
            y1={stroke}
            x2={px / 2}
            y2={px - stroke}
          >
            <stop offset="0%" stopColor={secondary} />
            <stop offset="100%" stopColor={primary} />
          </linearGradient>
        </defs>

        {/* Center dot pulse */}
        <circle cx={px / 2} cy={px / 2} r={stroke * 0.7} fill={primary} opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.1s" repeatCount="indefinite" />
        </circle>
      </svg>

      {label && (
        <span
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: Math.max(9, px * 0.22), color: primary, opacity: 0.7 }}
        >
          {label}
        </span>
      )}

      {/* Shared keyframe (duplicated from HUDPageLoader — harmless) */}
      <style>{`
        @keyframes hud-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  )
}
