import React from 'react'
import { cn } from '@/lib/utils'

/** Section card on admin pages: one edge, one fill, the same padding everywhere. */
export const ADMIN_CARD = 'rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 lg:p-5 space-y-3'

/** Text field, textarea or select on admin pages. */
export const ADMIN_FIELD =
  'min-h-10 rounded-control border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-muted outline-hidden transition-colors hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus'

/** Text link on admin pages: body ink, brightens on hover, no underline mark. */
export const QUIET_LINK =
  'inline-flex items-center gap-1 rounded-control text-xs font-semibold text-ink-body transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Field label on admin forms. */
export const ADMIN_LABEL = 'text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted'

/** Card heading: icon, title, optional note and actions on the right. */
export function AdminCardHeading({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0 space-y-1">
        <h2 className="flex items-center gap-2 font-grotesk text-sm font-bold uppercase tracking-[0.08em] text-ink">
          {icon ? <span className="text-ink-muted [&_svg]:h-4 [&_svg]:w-4" aria-hidden>{icon}</span> : null}
          {title}
        </h2>
        {description ? <p className="text-xs text-ink-muted leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}

/** On/off switch used for experiments and store settings. */
export function AdminSwitch({
  checked,
  onChange,
  label,
  disabled,
  testId,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  testId?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-40',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        checked ? 'border-cyan-glow bg-cyan-glow/30' : 'border-line bg-surface-2',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full transition-transform',
          checked ? 'translate-x-6 bg-cyan-glow' : 'translate-x-1 bg-ink-muted',
        )}
      />
    </button>
  )
}
