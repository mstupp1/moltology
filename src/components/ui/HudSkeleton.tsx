import React from 'react'
import { cn } from '@/lib/utils'

export interface HudSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'crimson' | 'neutral'
  width?: string | number
  height?: string | number
}

export const HudSkeleton = React.forwardRef<HTMLDivElement, HudSkeletonProps>(
  (
    {
      variant = 'cyan',
      width,
      height,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      cyan: 'bg-gradient-to-r from-surface-1 via-cyan-glow/20 to-surface-1 border border-cyan-glow/20 shadow-[0_0_8px_rgba(0,195,255,0.1)]',
      crimson: 'bg-gradient-to-r from-surface-1 via-crimson-aggro/20 to-surface-1 border border-crimson-aggro/20 shadow-[0_0_8px_rgba(255,69,58,0.1)]',
      neutral: 'bg-gradient-to-r from-surface-1 via-[#262b2b] to-surface-1 border border-line-subtle/30',
    }[variant]

    const inlineStyles: React.CSSProperties = {
      width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      ...style,
    }

    return (
      <div
        ref={ref}
        style={inlineStyles}
        className={cn(
          'relative rounded-none animate-pulse overflow-hidden select-none',
          variantStyles,
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[scanline_2s_infinite]" />
      </div>
    )
  }
)

HudSkeleton.displayName = 'HudSkeleton'
