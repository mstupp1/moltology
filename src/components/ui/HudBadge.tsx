import React from 'react'
import { cn } from '@/lib/utils'

export interface HudBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'crimson' | 'emerald' | 'warning' | 'sacred' | 'neutral'
  dot?: boolean
  pulse?: boolean
}

export const HudBadge = React.forwardRef<HTMLSpanElement, HudBadgeProps>(
  (
    {
      children,
      variant = 'cyan',
      dot = false,
      pulse = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      cyan: { badge: 'border-cyan-glow/40 bg-cyan-soft text-cyan-glow', dot: 'bg-cyan-glow' },
      crimson: { badge: 'border-crimson-aggro/45 bg-crimson-soft text-crimson-text', dot: 'bg-crimson-aggro' },
      emerald: { badge: 'border-emerald-500/40 text-emerald-500', dot: 'bg-emerald-500' },
      warning: { badge: 'border-amber-500/40 text-amber-500', dot: 'bg-amber-500' },
      sacred: { badge: 'border-crimson-aggro/60 bg-crimson-soft text-crimson-text', dot: 'bg-sacred-glow' },
      neutral: { badge: 'border-line text-ink-muted', dot: 'bg-ink-muted' },
    }[variant]

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 min-h-[22px] font-sans text-[11px] leading-none font-bold tracking-[0.08em] uppercase px-2 border rounded-chip select-none',
          variantStyles.badge,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              variantStyles.dot,
              pulse && 'animate-pulse'
            )}
          />
        )}
        <span>{children}</span>
      </span>
    )
  }
)

HudBadge.displayName = 'HudBadge'
