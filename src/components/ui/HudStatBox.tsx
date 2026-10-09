import React from 'react'
import { cn } from '@/lib/utils'

export interface HudStatBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  subtext?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  variant?: 'cyan' | 'crimson' | 'neutral'
  texture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none'
}

export const HudStatBox = React.forwardRef<HTMLDivElement, HudStatBoxProps>(
  (
    {
      label,
      value,
      subtext,
      trend,
      trendValue,
      icon,
      variant = 'cyan',
      texture = 'none',
      className = '',
      ...props
    },
    ref
  ) => {
    const textureClass = {
      chitin: 'texture-pbr-chitin',
      hex: 'texture-pbr-hex',
      alloy: 'texture-pbr-alloy',
      carbon: 'texture-pbr-carbon',
      basalt: 'texture-pbr-basalt',
      circuit: 'texture-pbr-circuit',
      none: '',
    }[texture]
    const variantStyles = {
      cyan: { container: 'border-line-subtle bg-surface-1/90', label: 'text-ink-muted', value: 'text-cyan-glow' },
      crimson: { container: 'border-crimson-aggro/35 bg-surface-crimson/90', label: 'text-ink-muted', value: 'text-crimson-text' },
      neutral: { container: 'border-line-subtle bg-surface-1', label: 'text-ink-muted', value: 'text-ink' },
    }[variant]

    const trendColor = {
      up: 'text-emerald-500',
      down: 'text-crimson-text',
      neutral: 'text-ink-muted',
    }

    const trendSymbol = {
      up: '▲',
      down: '▼',
      neutral: '■',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative border p-4 rounded-card hud-sheen shadow-sheen-inset font-sans flex flex-col justify-between gap-2 backdrop-blur-md',
          variantStyles.container,
          textureClass,
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-[11px] font-bold uppercase tracking-[0.08em] truncate', variantStyles.label)}>
            {label}
          </span>
          {icon && <span className="text-cyan-glow shrink-0">{icon}</span>}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className={cn('text-xl sm:text-2xl font-bold tracking-tight tabular-nums', variantStyles.value)}>
            {value}
          </div>
          {trend && trendValue && (
            <span className={cn('text-[11px] font-bold tracking-[0.08em] flex items-center gap-1 tabular-nums', trendColor[trend])}>
              <span>{trendSymbol[trend]}</span>
              <span>{trendValue}</span>
            </span>
          )}
        </div>

        {subtext && (
          <div className="text-xs text-ink-muted border-t border-line-subtle pt-2 mt-0.5">
            {subtext}
          </div>
        )}
      </div>
    )
  }
)

HudStatBox.displayName = 'HudStatBox'
