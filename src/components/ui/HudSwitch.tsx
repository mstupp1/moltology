import React from 'react'
import { cn } from '@/lib/utils'

/** On/off switch in the Settings style. Give it a visible label nearby or an `aria-label`. */
export function HudSwitch({
  checked,
  onChange,
  disabled = false,
  className,
  ...aria
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      {...aria}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-cyan-glow border-transparent' : 'bg-surface-3 border-line',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out motion-reduce:transition-none',
          checked ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-ink-muted',
        )}
      />
    </button>
  )
}
