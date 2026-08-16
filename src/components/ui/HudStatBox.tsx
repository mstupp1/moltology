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
  showCornerBrackets?: boolean
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
      showCornerBrackets = false,
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
      cyan: {
        container: 'border-[#00c3ff]/40 bg-[#0a1012]/80 shadow-[0_0_10px_rgba(0,195,255,0.15)]',
        label: 'text-[#839493]',
        value: 'text-[#00c3ff] drop-shadow-[0_0_6px_rgba(0,195,255,0.3)]',
        bracket: 'border-[#00c3ff]',
      },
      crimson: {
        container: 'border-[#ff453a]/40 bg-[#140809]/80 shadow-[0_0_10px_rgba(255,69,58,0.15)]',
        label: 'text-[#839493]',
        value: 'text-[#ff453a] drop-shadow-[0_0_6px_rgba(255,69,58,0.3)]',
        bracket: 'border-[#ff453a]',
      },
      neutral: {
        container: 'border-[#3a4a49] bg-[#0f1414]',
        label: 'text-[#839493]',
        value: 'text-[#dfe3e3]',
        bracket: 'border-[#3a4a49]',
      },
    }[variant]

    const trendColor = {
      up: 'text-[#10b981]',
      down: 'text-[#ff453a]',
      neutral: 'text-[#839493]',
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
          'relative border p-4 rounded-none font-mono flex flex-col justify-between gap-2 backdrop-blur-md',
          variantStyles.container,
          textureClass,
          className
        )}
        {...props}
      >
        {showCornerBrackets && (
          <>
            <span className={cn('absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 pointer-events-none', variantStyles.bracket)} />
            <span className={cn('absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 pointer-events-none', variantStyles.bracket)} />
            <span className={cn('absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 pointer-events-none', variantStyles.bracket)} />
            <span className={cn('absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 pointer-events-none', variantStyles.bracket)} />
          </>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-[11px] font-bold uppercase tracking-wider truncate', variantStyles.label)}>
            {label}
          </span>
          {icon && <span className="text-[#00c3ff] shrink-0">{icon}</span>}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className={cn('text-xl sm:text-2xl font-bold tracking-tight', variantStyles.value)}>
            {value}
          </div>
          {trend && trendValue && (
            <span className={cn('text-[10px] font-bold tracking-wider flex items-center gap-1', trendColor[trend])}>
              <span>{trendSymbol[trend]}</span>
              <span>{trendValue}</span>
            </span>
          )}
        </div>

        {subtext && (
          <div className="text-[10px] text-[#839493] tracking-tight border-t border-[#3a4a49]/30 pt-1.5 mt-0.5">
            {subtext}
          </div>
        )}
      </div>
    )
  }
)

HudStatBox.displayName = 'HudStatBox'
