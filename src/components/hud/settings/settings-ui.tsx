import React from 'react'
import { cn } from '@/lib/utils'

/** The one card style on the Settings page: solid surface-1, titled, standard card padding. */
export function SettingsCard({
  title,
  description,
  titleExtra,
  children,
  className,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Small inline item beside the title, such as a badge. */
  titleExtra?: React.ReactNode
  children?: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
  return (
    <section
      className={cn(
        'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 space-y-3',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-grotesk text-sm font-bold text-ink">{title}</h2>
          {titleExtra}
        </div>
        {description ? (
          <p className="text-xs text-ink-muted font-sans mt-0.5">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Rows inside a SettingsCard, split by hairline dividers. */
export function SettingsRows({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-line-subtle [&>*]:py-2 sm:[&>*]:py-2.5 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
      {children}
    </div>
  )
}

/** One setting: icon, label, status line, and its control on the right. */
export function SettingsRow({
  icon,
  label,
  status,
  control,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  status?: React.ReactNode
  control?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-cyan-glow [&>svg]:w-5 [&>svg]:h-5" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <span className="text-sm font-grotesk font-bold text-ink block">{label}</span>
          {status ? <span className="text-xs text-ink-muted font-sans block">{status}</span> : null}
        </div>
      </div>
      {control ? <div className="shrink-0">{control}</div> : null}
    </div>
  )
}
