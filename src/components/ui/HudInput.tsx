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
          <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted flex items-center justify-between">
            <span>{label}</span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {startIcon && (
            <span className="absolute left-3 text-ink-muted pointer-events-none flex items-center justify-center">
              {startIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full min-h-10 bg-surface-2 text-ink placeholder:text-ink-muted/70 text-sm font-sans rounded-control',
              'border border-line py-2 px-3 transition-[border-color,box-shadow] duration-200 outline-none hover:border-line-hover',
              'focus:border-cyan-glow focus:shadow-field-focus',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-1',
              startIcon && 'pl-9',
              endIcon && 'pr-9',
              error && 'border-crimson-aggro hover:border-crimson-aggro focus:border-crimson-aggro focus:shadow-field-error',
              className
            )}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 text-ink-muted flex items-center justify-center">
              {endIcon}
            </span>
          )}
        </div>
        {error ? (
          <span className="text-xs text-crimson-text font-sans flex items-center gap-1">
            ⚠ {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-ink-muted font-sans">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

HudInput.displayName = 'HudInput'
