import React from 'react'
import { cn } from '@/lib/utils'

export interface HudButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'crimson' | 'sacred' | 'dark' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const HudButton = React.forwardRef<HTMLButtonElement, HudButtonProps>(
  (
    {
      children,
      variant = 'cyan',
      size = 'md',
      glow = true,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1 text-[11px] gap-1.5 min-h-[30px]',
      md: 'px-5 py-2 text-xs gap-2 min-h-[38px]',
      lg: 'px-7 py-3 text-sm gap-2.5 min-h-[46px]',
    }[size]

    const variantClasses = {
      cyan: cn(
        'border border-[#00c3ff] bg-gradient-to-r from-[#05222b] via-[#093d4a] to-[#062833] text-white',
        glow && 'shadow-[0_0_12px_rgba(0,195,255,0.4),inset_0_0_8px_rgba(0,195,255,0.2)] hover:shadow-[0_0_20px_rgba(0,195,255,0.7),inset_0_0_12px_rgba(0,195,255,0.4)]',
        'hover:border-[#33d1ff] hover:bg-[#00c3ff]/20'
      ),
      crimson: cn(
        'border border-[#ff453a] bg-gradient-to-r from-[#4d1014] via-[#7a1820] to-[#591217] text-white',
        glow && 'shadow-[0_0_12px_rgba(255,69,58,0.4),inset_0_0_8px_rgba(255,69,58,0.2)] hover:shadow-[0_0_20px_rgba(255,69,58,0.7),inset_0_0_12px_rgba(255,69,58,0.4)]',
        'hover:border-[#ff6658] hover:bg-[#ff453a]/20'
      ),
      sacred: cn(
        'border border-[#ff453a]/80 bg-[#ff453a]/10 text-[#ff6358] hover:text-white',
        glow && 'shadow-[0_0_16px_rgba(255,69,58,0.5),inset_0_0_10px_rgba(255,69,58,0.3)] hover:shadow-[0_0_24px_rgba(255,69,58,0.8)]',
        'hover:border-[#ff453a] hover:bg-[#ff453a]/25'
      ),
      dark: cn(
        'border border-[#3a4a49] bg-[#0f1414] text-[#dfe3e3] hover:text-white hover:border-[#00c3ff]/70',
        glow && 'shadow-[0_0_8px_rgba(0,0,0,0.5)] hover:shadow-[0_0_12px_rgba(0,195,255,0.3)]',
        'hover:bg-[#171c1c]'
      ),
      ghost: cn(
        'border border-transparent bg-transparent text-[#839493] hover:text-[#00c3ff] hover:border-[#00c3ff]/40',
        glow && 'hover:shadow-[0_0_10px_rgba(0,195,255,0.2)]',
        'hover:bg-[#00c3ff]/10'
      ),
    }[variant]

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded-none transition-all duration-200 cursor-pointer select-none active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none',
          sizeClasses,
          variantClasses,
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
        <span className="relative z-10 inline-flex items-center justify-center gap-2 truncate">{children}</span>
        {icon && iconPosition === 'right' && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      </button>
    )
  }
)

HudButton.displayName = 'HudButton'
