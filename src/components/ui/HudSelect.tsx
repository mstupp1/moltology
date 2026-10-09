import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface HudSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface HudSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  options?: HudSelectOption[]
}

export const HudSelect = React.forwardRef<HTMLSelectElement, HudSelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      children,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `hud-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5 font-sans', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full min-h-10 bg-surface-2 text-ink text-sm font-sans rounded-control appearance-none cursor-pointer',
              'border border-line py-2 pl-3 pr-9 transition-[border-color,box-shadow] duration-200 outline-none hover:border-line-hover',
              'focus:border-cyan-glow focus:shadow-field-focus',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-1',
              error && 'border-crimson-aggro hover:border-crimson-aggro focus:border-crimson-aggro focus:shadow-field-error',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-surface-2 text-ink">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className="absolute right-3 pointer-events-none text-ink-muted">
            <ChevronDown size={14} />
          </span>
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

HudSelect.displayName = 'HudSelect'
