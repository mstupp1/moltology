import React from 'react'
import { cn } from '@/lib/utils'

export interface HudTitlePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /**
   * Compact for page sections, integrated inside a workspace, hero for substantial introductions,
   * band for the header that runs edge to edge across the top of the page panel.
   */
  treatment?: 'compact' | 'integrated' | 'hero' | 'band'
  /** Band only: a row of section tabs (`HudTitleBandTop`) sits directly above, so the band continues it. */
  joined?: boolean
  /** Full-width navigation or filters, below the heading and actions. */
  toolbar?: React.ReactNode
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
  treatment = 'compact',
  joined = false,
  toolbar,
  accent = 'cyan',
  children,
  className,
  ...props
}: HudTitlePanelProps) {
  const accentClasses = ACCENT_CLASS[accent]
  return (
    <div
      data-heading-treatment={treatment}
      className={cn(
        'relative flex flex-wrap items-start justify-between gap-x-6 gap-y-3',
        treatment === 'compact' && 'py-1',
        treatment === 'band' &&
          cn('bg-surface-2 border-b border-line-subtle', joined ? 'hud-title-band-rest pt-2 pb-4 md:pb-5' : 'hud-title-band'),
        treatment === 'integrated' && 'border-b border-line-subtle pb-4',
        treatment === 'hero' && `overflow-hidden rounded-card border border-line-subtle border-l-2 ${accentClasses.border} bg-surface-1 hud-sheen p-4 sm:p-5`,
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 basis-56 space-y-1.5 max-w-2xl">
        {eyebrow ? (
          <div className={cn('flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em]', accentClasses.eyebrow)}>
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-grotesk font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
          {title}
        </h1>
        {description ? <p className="text-xs text-ink-muted leading-relaxed">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex w-full max-w-full flex-wrap items-center gap-2.5 sm:w-auto">{actions}</div> : null}
      {toolbar ? <div className="w-full min-w-0 basis-full">{toolbar}</div> : null}
    </div>
  )
}

/**
 * First row of a page header band: the section tabs, pulled up to the panel's top edge so
 * they sit level with the search pill. The page's band (`joined`) follows directly below.
 */
export function HudTitleBandTop({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('hud-title-band-top bg-surface-2', className)}>{children}</div>
}
