import React from 'react'
import { Link } from '@tanstack/react-router'
import { Award, BookOpen, ChevronRight, GraduationCap } from 'lucide-react'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { ACADEMY_COPY, levelLabel } from '@/lib/academy'
import type { AcademyLevel } from '@/lib/academy-types'
import { cn } from '@/lib/utils'
import { getAssetUrl } from '@/lib/assets'

export const ACADEMY_FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Shared card shell for Academy panels. */
export const ACADEMY_CARD = 'rounded-card border border-line-subtle bg-surface-1 hud-sheen'

/** A whole-card link: brightens its edge on hover and focus. */
export const ACADEMY_CARD_LINK = cn(
  ACADEMY_CARD,
  'block transition-[border-color,background-color] duration-200 hover:border-line-strong hover:bg-surface-2',
  ACADEMY_FOCUS,
)

export function AcademyFrame({ children }: { children: React.ReactNode }) {
  return (
    <GuestLockGuard featureName="Molt Academy" message={ACADEMY_COPY.guestLock}>
      <div className="space-y-3.5 sm:space-y-5 font-sans relative">{children}</div>
    </GuestLockGuard>
  )
}

/** Catalog / Certifications switch. The current page is a lit tile. */
export function AcademyNav({ current }: { current: 'catalog' | 'certificates' | null }) {
  const items = [
    { key: 'catalog' as const, to: '/lectures' as const, label: 'Catalog', icon: BookOpen },
    { key: 'certificates' as const, to: '/lectures/certificates' as const, label: 'Certifications', icon: Award },
  ]
  return (
    <nav className="flex gap-1 rounded-control border border-line-subtle bg-abyss/40 p-1" aria-label="Academy">
      {items.map(({ key, to, label, icon: Icon }) => {
        const lit = current === key
        return (
          <Link
            key={key}
            to={to}
            aria-current={lit ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-8 px-3 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] transition-[background-color,color,box-shadow] duration-200',
              lit ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
              ACADEMY_FOCUS,
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', lit ? 'text-cyan-glow' : '')} aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Academy › Course › Lesson trail above detail pages. */
export function AcademyCrumbs({ items }: { items: { label: string; link?: React.ReactElement }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/lectures" className={cn('inline-flex items-center gap-1.5 rounded-control px-1 hover:text-ink', ACADEMY_FOCUS)}>
            <GraduationCap className="w-3.5 h-3.5 text-cyan-glow" aria-hidden="true" />
            Academy
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {item.link ?? <span className="text-ink truncate" aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export const ACADEMY_CRUMB_LINK = cn('rounded-control px-1 hover:text-ink truncate', ACADEMY_FOCUS)

export function AcademyProgress({
  percent,
  label = 'Progress',
  compact = false,
}: {
  percent: number
  label?: string
  compact?: boolean
}) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)))
  const done = safe >= 100
  return (
    <div className="space-y-1.5">
      {compact ? null : (
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          <span>{label}</span>
          <span className={done ? 'text-emerald-500' : 'text-ink'}>{done ? 'Complete' : `${safe}%`}</span>
        </div>
      )}
      <div
        className="h-1.5 rounded-chip bg-surface-3 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
      >
        <div className={cn('h-full rounded-chip', done ? 'bg-emerald-500' : 'bg-cyan-glow')} style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

export function LevelMark({ level }: { level: AcademyLevel }) {
  const bars = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn('w-1 rounded-chip', bar <= bars ? 'bg-cyan-glow' : 'bg-surface-3')}
            style={{ height: `${4 + bar * 2}px` }}
          />
        ))}
      </span>
      {levelLabel(level)}
    </span>
  )
}

/** One-line empty state for a section that has nothing in it yet. */
export function AcademyEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-control border border-dashed border-line-subtle px-3 py-2.5 text-xs text-ink-muted leading-relaxed">
      {children}
    </p>
  )
}

export function AcademySectionHeading({
  id,
  title,
  subtitle,
  action,
}: {
  id: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="space-y-0.5">
        <h2 id={id} className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase text-ink">
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-ink-muted leading-relaxed">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** Small cyan text action with an arrow, for "Open …" links in section headers and cards. */
export const ACADEMY_TEXT_ACTION = cn(
  'inline-flex items-center gap-1 min-h-8 px-2 -mx-2 rounded-control text-xs font-bold text-cyan-glow hover:bg-surface-2 transition-colors whitespace-nowrap',
  ACADEMY_FOCUS,
)

/** Link styled like a HudButton, for navigation that should look like an action. */
export function academyButtonLink(variant: 'primary' | 'secondary', size: 'md' | 'lg' = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-bold uppercase tracking-[0.08em] transition-colors',
    size === 'lg' ? 'min-h-12 px-6 text-[13px]' : 'min-h-10 px-[18px] text-xs',
    variant === 'primary'
      ? 'bg-cyan-glow text-abyss hover:bg-cyan-hover'
      : 'border border-line bg-surface-1 text-ink hover:bg-surface-2 hover:border-line-strong',
    ACADEMY_FOCUS,
  )
}

/**
 * Cover art for a course or track. Falls back to a quiet depth gradient with the course code,
 * so a catalog without artwork still reads as designed.
 */
export function AcademyCover({
  url,
  label,
  className,
  children,
}: {
  url: string | null
  label?: string
  className?: string
  children?: React.ReactNode
}) {
  const image = coverSrc(url)
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-surface-3 via-surface-2 to-abyss bg-cover bg-center',
        className,
      )}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {image ? (
        <div className="absolute inset-0 bg-gradient-to-t from-abyss/85 via-abyss/20 to-transparent" aria-hidden="true" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(0,195,255,0.18),transparent_60%)]" />
          {label ? (
            <span className="relative font-grotesk font-extrabold text-2xl tracking-[0.12em] text-ink/15 select-none">{label}</span>
          ) : (
            <GraduationCap className="relative w-10 h-10 text-ink/15" />
          )}
        </div>
      )}
      {children ? <div className="relative h-full">{children}</div> : null}
    </div>
  )
}

export function AcademyMissing({ message }: { message: string }) {
  return (
    <AcademyFrame>
      <div className={cn(ACADEMY_CARD, 'p-5 sm:p-6 space-y-3')}>
        <p className="text-sm text-ink">{message}</p>
        <Link to="/lectures" className={ACADEMY_TEXT_ACTION}>
          Back to Academy
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </AcademyFrame>
  )
}

export function coverSrc(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return getAssetUrl(url.replace(/^\//, ''))
}
