import React from 'react'
import { cn } from '@/lib/utils'
import '@/styles/pbr-textures.css'

export interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'teal' | 'crimson' | 'dark' | 'ghost'
  texture?: 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none'
  glow?: boolean
  showCornerBrackets?: boolean
  interactive?: boolean
}

export const HudCard = React.forwardRef<HTMLDivElement, HudCardProps>(
  (
    {
      children,
      variant = 'teal',
      texture = 'none',
      glow = false,
      showCornerBrackets = false,
      interactive = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const borderVariantMap = {
      teal: 'border-line-subtle bg-surface-1/90 text-ink',
      cyan: 'border-cyan-glow/40 bg-surface-1/90 text-ink',
      crimson: 'border-crimson-aggro/40 bg-surface-crimson/90 text-ink',
      dark: 'border-line bg-surface-1 text-ink',
      ghost: 'border-line-subtle bg-transparent text-ink',
    }[variant]

    const textureClass = {
      chitin: 'texture-pbr-chitin',
      hex: 'texture-pbr-hex',
      alloy: 'texture-pbr-alloy',
      carbon: 'texture-pbr-carbon',
      basalt: 'texture-pbr-basalt',
      circuit: 'texture-pbr-circuit',
      none: '',
    }[texture]

    // Resting cards stay quiet; glow is opt-in and soft.
    const glowMap = {
      teal: 'shadow-[0_4px_20px_rgba(0,0,0,0.45)]',
      cyan: 'shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_16px_rgba(0,195,255,0.18)]',
      crimson: 'shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_16px_rgba(255,69,58,0.18)]',
      dark: 'shadow-[0_4px_20px_rgba(0,0,0,0.6)]',
      ghost: '',
    }[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'relative border rounded-card backdrop-blur-md transition-[border-color,transform,box-shadow] duration-200',
          variant !== 'ghost' && 'hud-sheen shadow-sheen-inset',
          borderVariantMap,
          textureClass,
          glow && glowMap,
          showCornerBrackets && 'hud-ticks',
          interactive &&
            'cursor-pointer hover:border-line-strong hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

HudCard.displayName = 'HudCard'

export const HudContainer = HudCard

export const HudCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-4 py-3.5 border-b border-line-subtle flex items-center justify-between gap-3 font-sans text-xs uppercase tracking-[0.08em]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
HudCardHeader.displayName = 'HudCardHeader'

export const HudCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-grotesk font-bold text-xs tracking-[0.08em] text-ink uppercase flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
HudCardTitle.displayName = 'HudCardTitle'

export const HudCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 font-sans text-sm text-ink-body', className)} {...props}>
      {children}
    </div>
  )
)
HudCardContent.displayName = 'HudCardContent'

export const HudCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3 border-t border-line-subtle flex items-center justify-between gap-3 font-sans text-xs text-ink-muted', className)}
      {...props}
    >
      {children}
    </div>
  )
)
HudCardFooter.displayName = 'HudCardFooter'
