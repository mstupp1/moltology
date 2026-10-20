import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export interface DashboardPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  icon: React.ReactNode
  title: string
  subtitle?: string
  /** Header action that opens the full page, e.g. { label: 'Open boards', onClick }. */
  action?: DashboardPanelActionProps
  /** Extra header content (unread marks), placed before the action. */
  meta?: React.ReactNode
  children: React.ReactNode
}

/**
 * The one card shell every dashboard panel uses: icon, short caps label, a sentence of context,
 * and a single link to the full page in the header. Grows with its content; no fixed heights.
 */
export function DashboardPanel({
  icon,
  title,
  subtitle,
  action,
  meta,
  className,
  children,
  ...props
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 flex flex-col gap-3 min-w-0',
        className,
      )}
      {...props}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5 shrink-0 text-cyan-glow [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta}
          {action && <DashboardPanelAction {...action} />}
        </div>
      </header>
      {children}
    </section>
  )
}

export interface DashboardPanelActionProps {
  label: string
  onClick: () => void
  ariaLabel?: string
}

export function DashboardPanelAction({ label, onClick, ariaLabel }: DashboardPanelActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 min-h-8 px-2 -mr-2 rounded-control text-xs font-bold text-cyan-glow hover:bg-surface-2 transition-colors whitespace-nowrap',
        FOCUS,
      )}
    >
      {label}
      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  )
}

/** A one-line empty state: a short title, then what to do about it. */
export function DashboardEmptyRow({ title, body, testId }: { title: string; body?: string; testId?: string }) {
  return (
    <p
      data-testid={testId}
      className="rounded-control border border-dashed border-line-subtle px-3 py-2.5 text-xs text-ink-muted leading-relaxed"
    >
      <span className="font-bold text-ink">{title}</span>
      {body ? (
        <>
          {'. '}
          <span>{body}</span>
        </>
      ) : null}
    </p>
  )
}

export const DASHBOARD_FOCUS = FOCUS
