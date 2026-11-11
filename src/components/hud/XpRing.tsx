import React, { useId } from 'react'

/** Geometry for the two sizes the portrait comes in. */
export const XP_RING_SIZES = {
  // Phone top bar is 56px tall: the medallion (54px) fits inside it. On both sizes the
  // badge tucks 4px into the portrait's bottom edge (badgeTop is from the medallion's top).
  phone: { portrait: 36, gapInner: 1.5, xpStroke: 3, gapOuter: 2, notchStroke: 2.5, badgeTop: 41 },
  // Desktop has room to spare: a 50px portrait in a 74px medallion beside the 56px pill.
  desktop: { portrait: 50, gapInner: 2, xpStroke: 4, gapOuter: 2.5, notchStroke: 3.5, badgeTop: 58 },
} as const

export type XpRingSize = keyof typeof XP_RING_SIZES

export function xpRingGeometry(size: XpRingSize) {
  const g = XP_RING_SIZES[size]
  const xpRadius = g.portrait / 2 + g.gapInner + g.xpStroke / 2
  const notchRadius = xpRadius + g.xpStroke / 2 + g.gapOuter + g.notchStroke / 2
  const box = Math.ceil(2 * (notchRadius + g.notchStroke / 2))
  return { ...g, xpRadius, notchRadius, box, center: box / 2 }
}

/** Both rings leave a 60° opening at the bottom for the sub-stage badge. */
const ARC_START = 210
const ARC_SWEEP = 300
const NOTCH_GAP = 7

function point(c: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [c + r * Math.cos(rad), c + r * Math.sin(rad)] as const
}

export function arcPath(c: number, r: number, from: number, to: number): string {
  const [x0, y0] = point(c, r, from)
  const [x1, y1] = point(c, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`
}

export interface XpRingProps {
  size: XpRingSize
  portrait: React.ReactNode
  /** 0..1 progress to the next sub-stage. */
  ratio: number
  /** Today's tasks done, out of `total`. */
  done: number
  total: number
  /** Sub-stage code shown under the portrait (e.g. "L-2"); hidden while null. */
  badge: string | null
  /** Turns off the arc's slide (used for the instant reset after a sub-stage is reached). */
  instant?: boolean
  /** Plays the one-off sub-stage pulse; change the key to replay it. */
  pulseKey?: number
  /** Index of a notch that just lit, so it can pop. */
  poppedNotch?: number | null
}

/**
 * The member's portrait wrapped in two rings: the inner arc is XP towards the next
 * sub-stage, the outer eight notches are today's alignment tasks.
 */
export function XpRing({ size, portrait, ratio, done, total, badge, instant, pulseKey, poppedNotch }: XpRingProps) {
  const g = xpRingGeometry(size)
  const gradientId = `xp-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const glowId = `${gradientId}-glow`
  const clamped = Math.min(1, Math.max(0, ratio))
  const allDone = total > 0 && done >= total
  const notchSweep = ARC_SWEEP / Math.max(total, 1)
  const track = arcPath(g.center, g.xpRadius, ARC_START, ARC_START + ARC_SWEEP)

  return (
    <span
      key={pulseKey}
      data-testid="xp-ring"
      className={`relative inline-flex items-center justify-center shrink-0 ${pulseKey ? 'xp-level-pulse' : ''}`}
      style={{ width: g.box, height: g.box }}
    >
      <svg
        aria-hidden="true"
        width={g.box}
        height={g.box}
        viewBox={`0 0 ${g.box} ${g.box}`}
        className="absolute inset-0 overflow-visible pointer-events-none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            {/* style, not the stopColor prop: the renderer does not map that attribute */}
            <stop offset="0" style={{ stopColor: '#00c3ff' }} />
            <stop offset="1" style={{ stopColor: '#00ffcc' }} />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* XP towards the next sub-stage */}
        {/* Empty rails are faint and see-through so the pill shows between the rings */}
        <path d={track} fill="none" strokeWidth={g.xpStroke} strokeLinecap="round" className="stroke-ink/15" />
        <path
          data-testid="xp-ring-fill"
          data-ratio={clamped.toFixed(3)}
          d={track}
          fill="none"
          pathLength={1}
          stroke={`url(#${gradientId})`}
          strokeWidth={g.xpStroke}
          strokeLinecap="round"
          strokeDasharray={`${clamped} 1`}
          opacity={clamped > 0.001 ? 1 : 0}
          className={instant ? '' : 'transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none'}
        />

        {/* Today's tasks, one notch each */}
        <g filter={allDone ? `url(#${glowId})` : undefined} data-testid="xp-ring-notches" data-done={done}>
          {Array.from({ length: total }, (_, i) => {
            const from = ARC_START + i * notchSweep + NOTCH_GAP / 2
            const lit = i < done
            return (
              <path
                key={`${i}-${i === poppedNotch ? 'pop' : ''}`}
                d={arcPath(g.center, g.notchRadius, from, from + notchSweep - NOTCH_GAP)}
                fill="none"
                strokeWidth={g.notchStroke}
                strokeLinecap="round"
                style={{ '--notch-w': `${g.notchStroke}px` } as React.CSSProperties}
                className={`transition-colors duration-300 ${
                  lit ? (allDone ? 'stroke-emerald-400' : 'stroke-amber-300') : 'stroke-ink/15'
                } ${i === poppedNotch ? 'xp-notch-pop' : ''}`}
              />
            )
          })}
        </g>
      </svg>

      <span className="relative rounded-full overflow-hidden" style={{ width: g.portrait, height: g.portrait }}>
        {portrait}
      </span>

      {badge && (
        <span
          key={badge}
          data-testid="xp-ring-badge"
          className="xp-badge-in absolute left-1/2 -translate-x-1/2 px-1 py-[2px] rounded-control bg-abyss border border-cyan-glow/50 text-[11px] font-sans font-bold leading-none tabular-nums text-ink whitespace-nowrap pointer-events-none"
          style={{ top: g.badgeTop }}
        >
          {badge}
        </span>
      )}
    </span>
  )
}
