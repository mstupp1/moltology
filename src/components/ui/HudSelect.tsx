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
      <div className={cn('flex flex-col gap-1.5 font-mono', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-[11px] font-bold uppercase tracking-wider text-[#839493]">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-[#070b0b] text-[#dfe3e3] text-xs font-mono rounded-none appearance-none cursor-pointer',
              'border border-[#3a4a49] py-2 pl-3 pr-8 transition-all duration-200 outline-none',
              'focus:border-[#00c3ff] focus:bg-[#070b0b] focus:shadow-[0_0_10px_rgba(0,195,255,0.35)]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#030606]',
              error && 'border-[#ff453a] focus:border-[#ff453a] focus:shadow-[0_0_10px_rgba(255,69,58,0.4)]',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#0f1414] text-[#dfe3e3]">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className="absolute right-2.5 pointer-events-none text-[#839493]">
            <ChevronDown size={14} />
          </span>
        </div>
        {error ? (
          <span className="text-[10px] text-[#ff453a] font-mono tracking-tight flex items-center gap-1">
            ⚠ {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] text-[#839493] font-mono tracking-tight">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

HudSelect.displayName = 'HudSelect'
