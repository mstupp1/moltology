import React from 'react'
import { cn } from '@/lib/utils'
import '@/styles/pbr-textures.css'

/**
 * Variants:
 * - primary (alias cyan): solid cyan with the cut corner. One per screen, for the main action.
 * - crimson: solid red with the cut corner, for ritual or sacred main actions.
 * - secondary (alias dark): outlined surface button for everything else.
 * - ghost: text-only, for toolbars and low-weight actions.
 * - danger (alias sacred): outlined red, for destructive actions.
 */
export type HudButtonVariant = 'primary' | 'secondary' | 'danger' | 'cyan' | 'crimson' | 'sacred' | 'dark' | 'ghost'

export interface HudButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: HudButtonVariant
  size?: 'sm' | 'md' | 'lg'
  /** Hover glow on filled variants. */
  glow?: boolean
  fullWidth?: boolean
  /** Faint hex texture under the label. Off by default. */
  texture?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

type Resolved = 'primary' | 'crimson' | 'secondary' | 'ghost' | 'danger'

const resolveVariant = (variant: HudButtonVariant): Resolved => {
  switch (variant) {
    case 'cyan':
    case 'primary':
      return 'primary'
    case 'dark':
    case 'secondary':
      return 'secondary'
    case 'sacred':
    case 'danger':
      return 'danger'
    default:
      return variant
  }
}

const SIZE_CLASSES = {
  sm: 'px-3 min-h-8 text-[11px] gap-1.5 [--hud-cut:8px]',
  md: 'px-[18px] min-h-10 text-xs gap-2 [--hud-cut:10px]',
  lg: 'px-6 min-h-12 text-[13px] gap-2.5 [--hud-cut:12px]',
} as const

const VARIANT_CLASSES: Record<Resolved, string> = {
  primary: 'text-abyss',
  crimson: 'text-abyss',
  secondary:
    'bg-surface-1 hud-sheen border-line text-ink hover:bg-surface-2 hover:border-line-strong',
  ghost: 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-2',
  danger: 'border-crimson-aggro/55 text-crimson-text hover:bg-crimson-soft hover:border-crimson-aggro',
}

const FILL_CLASSES: Partial<Record<Resolved, string>> = {
  primary: 'bg-cyan-glow group-hover/hudbtn:bg-cyan-hover',
  crimson: 'bg-crimson-aggro group-hover/hudbtn:bg-crimson-hover',
}

const GLOW_CLASSES: Partial<Record<Resolved, string>> = {
  primary: 'hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.45)]',
  crimson: 'hover:drop-shadow-[0_0_10px_rgba(255,69,58,0.45)]',
}

export const HudButton = React.forwardRef<HTMLButtonElement, HudButtonProps>(
  (
    {
      children,
      variant = 'cyan',
      size = 'md',
      glow = true,
      fullWidth = false,
      texture = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const resolved = resolveVariant(variant)
    const fill = FILL_CLASSES[resolved]

    return (
      <button
        ref={ref}
        disabled={disabled}
        data-variant={resolved}
        className={cn(
          'group/hudbtn relative isolate inline-flex items-center justify-center font-grotesk font-bold uppercase tracking-[0.08em] leading-none',
          'rounded-control border transition-[color,background-color,border-color,filter] duration-200 cursor-pointer select-none active:translate-y-px',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:drop-shadow-none',
          fill && 'border-transparent',
          SIZE_CLASSES[size],
          VARIANT_CLASSES[resolved],
          glow && GLOW_CLASSES[resolved],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {fill && (
          <span
            aria-hidden="true"
            data-testid="hud-button-fill"
            className={cn('absolute -inset-px -z-10 rounded-[inherit] hud-cut transition-colors duration-200', fill)}
          />
        )}
        {texture && resolved !== 'ghost' && (
          <span aria-hidden="true" className="pbr-underlay pbr-underlay-hex opacity-15 pointer-events-none" />
        )}
        {icon && iconPosition === 'left' && <span className="relative shrink-0 flex items-center justify-center">{icon}</span>}
        <span className="relative inline-flex items-center justify-center gap-2 truncate">{children}</span>
        {icon && iconPosition === 'right' && <span className="relative shrink-0 flex items-center justify-center">{icon}</span>}
      </button>
    )
  }
)

HudButton.displayName = 'HudButton'
