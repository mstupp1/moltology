import React from 'react'
import { cn } from '@/lib/utils'

export interface HudTitlePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  accent?: 'cyan' | 'teal' | 'crimson' | 'green'
  children?: React.ReactNode
}

const ACCENT_CLASS = {
  cyan: { border: 'border-l-cyan-glow', eyebrow: 'text-cyan-glow' },
  teal: { border: 'border-l-cyan-glow', eyebrow: 'text-cyan-glow' },
  crimson: { border: 'border-l-crimson-aggro', eyebrow: 'text-crimson-text' },
  green: { border: 'border-l-emerald-500', eyebrow: 'text-emerald-400' },
} as const

export function HudTitlePanel({
  title,
  eyebrow,
  description,
  actions,
  accent = 'cyan',
  children,
  className,
  ...props
}: HudTitlePanelProps) {
  const accentClasses = ACCENT_CLASS[accent]
  return (
    <div
      className={`${cn(
        'relative overflow-hidden rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3.5 sm:p-4 md:p-5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4',
        className
      )} border-l-2 ${accentClasses.border}`}
      {...props}
    >
      <div className="space-y-1.5 max-w-2xl">
        {eyebrow ? (
          <div
            className={cn(
              'flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em]',
              accentClasses.eyebrow
            )}
          >
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-ink tracking-wider uppercase">
          {title}
        </h1>
        {description ? (
          <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t border-line-subtle md:border-t-0 md:border-l md:border-l-line-subtle md:pl-5 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
