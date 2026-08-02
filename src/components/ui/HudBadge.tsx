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
      cyan: {
        badge: 'border-[#00c3ff]/50 bg-[#00c3ff]/10 text-[#00c3ff] shadow-[0_0_6px_rgba(0,195,255,0.2)]',
        dot: 'bg-[#00c3ff] shadow-[0_0_6px_#00c3ff]',
      },
      crimson: {
        badge: 'border-[#ff453a]/50 bg-[#ff453a]/10 text-[#ff453a] shadow-[0_0_6px_rgba(255,69,58,0.2)]',
        dot: 'bg-[#ff453a] shadow-[0_0_6px_#ff453a]',
      },
      emerald: {
        badge: 'border-[#10b981]/50 bg-[#10b981]/10 text-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.2)]',
        dot: 'bg-[#10b981] shadow-[0_0_6px_#10b981]',
      },
      warning: {
        badge: 'border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.2)]',
        dot: 'bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]',
      },
      sacred: {
        badge: 'border-[#ff453a] bg-gradient-to-r from-[#4d1014] to-[#7a1820] text-white shadow-[0_0_8px_rgba(255,69,58,0.4)]',
        dot: 'bg-[#ff6358] shadow-[0_0_6px_#ff6358]',
      },
      neutral: {
        badge: 'border-[#3a4a49] bg-[#0f1414] text-[#839493]',
        dot: 'bg-[#839493]',
      },
    }[variant]

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border rounded-none select-none',
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
