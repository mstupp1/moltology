import React from 'react'
import { cn } from '@/lib/utils'

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
      teal: 'border-[#00c3ff]/40 bg-[#0a1012]/80 text-[#dfe3e3]',
      cyan: 'border-[#00c3ff] bg-[#051c24]/80 text-[#dfe3e3]',
      crimson: 'border-[#ff453a]/40 bg-[#140809]/80 text-[#dfe3e3]',
      dark: 'border-[#3a4a49] bg-[#0f1414]/90 text-[#dfe3e3]',
      ghost: 'border-[#3a4a49]/40 bg-transparent text-[#dfe3e3]',
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

    const glowMap = {
      teal: 'shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_12px_rgba(0,195,255,0.2)]',
      cyan: 'shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(0,195,255,0.35)]',
      crimson: 'shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_12px_rgba(255,69,58,0.25)]',
      dark: 'shadow-[0_4px_20px_rgba(0,0,0,0.8)]',
      ghost: '',
    }[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'relative border rounded-none backdrop-blur-md transition-all duration-200',
          borderVariantMap,
          textureClass,
          glow && glowMap,
          interactive && 'hover:border-[#00c3ff]/80 hover:shadow-[0_0_16px_rgba(0,195,255,0.3)] hover:-translate-y-0.5 cursor-pointer',
          className
        )}
        {...props}
      >
        {showCornerBrackets && (
          <>
            <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#00c3ff] pointer-events-none z-10" />
            <span className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#00c3ff] pointer-events-none z-10" />
            <span className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#00c3ff] pointer-events-none z-10" />
            <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#00c3ff] pointer-events-none z-10" />
          </>
        )}
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
        'px-5 py-3 border-b border-[#3a4a49]/40 flex items-center justify-between font-mono text-xs uppercase tracking-wider',
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
      className={cn('font-mono font-bold text-sm tracking-wider text-[#00c3ff] uppercase flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
HudCardTitle.displayName = 'HudCardTitle'

export const HudCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 font-mono text-xs text-[#dfe3e3]', className)} {...props}>
      {children}
    </div>
  )
)
HudCardContent.displayName = 'HudCardContent'

export const HudCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-3 border-t border-[#3a4a49]/40 flex items-center justify-between font-mono text-xs text-[#839493]', className)}
      {...props}
    >
      {children}
    </div>
  )
)
HudCardFooter.displayName = 'HudCardFooter'
