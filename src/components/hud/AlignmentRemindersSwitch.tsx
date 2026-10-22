import React from 'react'
import { Bell, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlignmentRemindersSwitchProps {
  enabled: boolean
  onToggle: () => void
  className?: string
  testId?: string
}

/** On/off switch for the 10-minute liturgy reminders (dashboard card and header panel). */
export function AlignmentRemindersSwitch({ enabled, onToggle, className, testId }: AlignmentRemindersSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      onClick={onToggle}
      aria-checked={enabled}
      aria-label="Reminders 10 minutes before each liturgy"
      title="Reminders 10 minutes before each liturgy"
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-2 min-h-[44px] -my-2 -mr-1 px-1 rounded-control text-[11px] font-bold text-ink-muted hover:text-ink transition-colors touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        className,
      )}
    >
      {enabled ? (
        <Bell className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
      ) : (
        <BellOff className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      Reminders
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-4 w-7 rounded-full border transition-colors',
          enabled ? 'bg-cyan-glow/30 border-cyan-glow/60' : 'bg-surface-3 border-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-2.5 w-2.5 rounded-full transition-[left,background-color]',
            enabled ? 'left-3.5 bg-cyan-glow' : 'left-0.5 bg-ink-muted',
          )}
        />
      </span>
    </button>
  )
}
