import React from 'react'
import { cn } from '@/lib/utils'

export interface HudGhostSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'crimson' | 'neutral' | 'teal'
  preset?: 'text' | 'heading' | 'avatar' | 'card' | 'badge' | 'button' | 'chart' | 'custom'
  width?: string | number
  height?: string | number
  cornerCut?: boolean
}

/**
 * Standardized modern Skeleton loader for Moltology.
 * Sleek, subtle dark placeholder block with optional HUD accent tinting.
 */
export const HudGhostSkeleton = React.forwardRef<HTMLDivElement, HudGhostSkeletonProps>(
  (
    {
      variant = 'neutral',
      preset = 'custom',
      width,
      height,
      cornerCut = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Subtle color variant styles
    const variantStyles = {
      cyan: 'bg-[#0b1619] border border-[#00c3ff]/20 text-[#00c3ff]',
      crimson: 'bg-[#180d0d] border border-[#ff453a]/20 text-[#ff453a]',
      teal: 'bg-[#0b1916] border border-[#00ffd5]/20 text-[#00ffd5]',
      neutral: 'bg-[#101515] border border-[#3a4a49]/30 text-[#839493]',
    }[variant]

    // Preset dimensions
    const presetDimensions: Record<string, { width?: string; height?: string; rounded?: string }> = {
      text: { width: '100%', height: '12px' },
      heading: { width: '55%', height: '20px' },
      avatar: { width: '40px', height: '40px', rounded: 'rounded-full' },
      badge: { width: '70px', height: '20px' },
      button: { width: '110px', height: '36px' },
      card: { width: '100%', height: '140px' },
      chart: { width: '100%', height: '180px' },
      custom: {},
    }

    const currentPreset = presetDimensions[preset] || {}

    const inlineStyles: React.CSSProperties = {
      width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : currentPreset.width,
      height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : currentPreset.height,
      ...style,
    }

    return (
      <div
        ref={ref}
        style={inlineStyles}
        className={cn(
          'relative overflow-hidden select-none animate-pulse',
          cornerCut && preset !== 'avatar' ? 'chamfer-corner' : (currentPreset.rounded || 'rounded-sm'),
          variantStyles,
          className
        )}
        {...props}
      >
        {/* Soft subtle shimmer glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[scanline_2.5s_infinite] pointer-events-none" />
        {children}
      </div>
    )
  }
)

HudGhostSkeleton.displayName = 'HudGhostSkeleton'

export interface HudGhostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'crimson' | 'neutral' | 'teal'
  lines?: number
  hasHeader?: boolean
}

/**
 * Standard Ghost Skeleton layout for HUD Cards.
 */
export function HudGhostCard({
  variant = 'neutral',
  lines = 3,
  hasHeader = true,
  className = '',
  ...props
}: HudGhostCardProps) {
  return (
    <div
      className={cn(
        'bg-[#080d0e]/80 border border-[#3a4a49]/60 p-4 rounded-sm space-y-4 shadow-sm',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#3a4a49]/40">
          <div className="flex items-center gap-2.5 flex-1">
            <HudGhostSkeleton variant={variant} preset="avatar" width={24} height={24} />
            <HudGhostSkeleton variant={variant} preset="heading" width="40%" height={16} />
          </div>
          <HudGhostSkeleton variant={variant} preset="badge" width={60} height={18} />
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <HudGhostSkeleton
            key={i}
            variant={variant}
            preset="text"
            width={i === lines - 1 ? '70%' : '100%'}
          />
        ))}
      </div>
    </div>
  )
}

export interface HudGhostStatBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'crimson' | 'neutral' | 'teal'
}

/**
 * Standard Ghost Skeleton layout for HUD Stat Boxes.
 */
export function HudGhostStatBox({ variant = 'neutral', className = '', ...props }: HudGhostStatBoxProps) {
  return (
    <div
      className={cn(
        'bg-[#080d0e]/80 border border-[#3a4a49]/60 p-3 rounded-sm space-y-2 relative',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <HudGhostSkeleton variant="neutral" preset="text" width="55%" height={10} />
        <HudGhostSkeleton variant={variant} width={14} height={14} cornerCut={false} />
      </div>
      <HudGhostSkeleton variant={variant} preset="heading" width="75%" height={22} />
      <div className="flex items-center justify-between pt-1 border-t border-[#3a4a49]/30">
        <HudGhostSkeleton variant="neutral" preset="text" width="35%" height={10} />
        <HudGhostSkeleton variant={variant} preset="badge" width={45} height={14} />
      </div>
    </div>
  )
}

export interface HudGhostWidgetProps {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

/**
 * Higher-order Ghost Loading Wrapper for HUD components.
 * Standardizes the toggle between live HUD components and ghost loading skeletons.
 */
export function HudGhostWidget({ isLoading, skeleton, children }: HudGhostWidgetProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }
  return <>{children}</>
}
