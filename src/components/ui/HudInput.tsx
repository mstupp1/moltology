import React from 'react'
import { cn } from '@/lib/utils'

export interface HudInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  fullWidth?: boolean
}

export const HudInput = React.forwardRef<HTMLInputElement, HudInputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      fullWidth = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `hud-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5 font-sans', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-[#839493] flex items-center justify-between">
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {startIcon && (
            <span className="absolute left-3 text-[#839493] pointer-events-none flex items-center justify-center">
              {startIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-[#070b0b] text-[#dfe3e3] placeholder-[#839493]/50 text-xs font-sans rounded-none',
              'border border-[#3a4a49] py-2 px-3 transition-all duration-200 outline-none',
              'focus:border-[#00c3ff] focus:bg-[#070b0b] focus:shadow-[0_0_10px_rgba(0,195,255,0.35)]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#030606]',
              startIcon && 'pl-9',
              endIcon && 'pr-9',
              error && 'border-[#ff453a] focus:border-[#ff453a] focus:shadow-[0_0_10px_rgba(255,69,58,0.4)]',
              className
            )}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 text-[#839493] flex items-center justify-center">
              {endIcon}
            </span>
          )}
        </div>
        {error ? (
          <span className="text-[10px] text-[#ff453a] font-sans tracking-tight flex items-center gap-1">
            ⚠ {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] text-[#839493] font-sans tracking-tight">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

HudInput.displayName = 'HudInput'
