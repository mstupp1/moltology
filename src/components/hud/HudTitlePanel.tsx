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
  /** Band only: a row of crumbs (`HudTitleBandTop`) sits directly above, so the band continues it. */
  joined?: boolean
  /**
   * Band only: the area's section tabs (`BandSectionNav` or `HudTabs`). Desktop: on the title row,
   * after a divider. Phones: their own row under the title.
   */
  sections?: React.ReactNode
  /** Band only: sections always get their own row under the title (areas with many sections, Admin). */
  sectionsBelow?: boolean
  /** Band only: on phones, actions (figures such as a wallet or XP) sit under the section tabs. */
  actionsBelowOnPhone?: boolean
  /** Band only: hide the description on phones (when actions and tabs already say enough). */
  hideDescriptionOnPhone?: boolean
  /** Band only: render the title as a plain paragraph when the page's content carries the h1. */
  titleAs?: 'h1' | 'p'
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
  sections,
  sectionsBelow = false,
  actionsBelowOnPhone = false,
  hideDescriptionOnPhone = false,
  titleAs = 'h1',
  toolbar,
  accent = 'cyan',
  children,
  className,
  ...props
}: HudTitlePanelProps) {
  const accentClasses = ACCENT_CLASS[accent]
  if (treatment === 'band') {
    return (
      <div
        data-heading-treatment="band"
        className={cn(
          'relative flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface-2 border-b border-line-subtle',
          joined ? 'hud-title-band-rest pt-2 pb-4 md:pb-5' : 'hud-title-band',
          (description || children || toolbar || (sections && sectionsBelow)) && 'has-more',
          className,
        )}
        {...props}
      >
        <BandHeadingRow
          title={title}
          sections={sections}
          sectionsBelow={sectionsBelow}
          actions={actions}
          actionsBelowOnPhone={actionsBelowOnPhone}
          clearPill={!joined}
          titleAs={titleAs}
        />
        {description ? (
          // Full-width wrapper so the line always starts its own row; the text keeps a reading width.
          <div className={cn('order-6 basis-full min-w-0', hideDescriptionOnPhone && 'max-md:hidden')}>
            <p className="max-w-2xl text-xs text-ink-muted leading-relaxed">{description}</p>
          </div>
        ) : null}
        {children ? <div className="order-6 basis-full min-w-0">{children}</div> : null}
        {toolbar ? <div className="order-7 basis-full min-w-0 pt-1">{toolbar}</div> : null}
      </div>
    )
  }
  return (
    <div
      data-heading-treatment={treatment}
      className={cn(
        'relative flex flex-wrap items-start justify-between gap-x-6 gap-y-3',
        treatment === 'compact' && 'py-1',
        treatment === 'integrated' && 'border-b border-line-subtle pb-4',
        treatment === 'hero' && `overflow-hidden rounded-card border border-line-subtle border-l-2 ${accentClasses.border} bg-surface-1 hud-sheen p-3 sm:p-4 lg:p-5`,
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 basis-56 space-y-1.5 max-w-2xl">
        {eyebrow ? (
          <div className={cn('eyebrow flex items-center gap-2', accentClasses.eyebrow)}>
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-grotesk font-semibold text-xl sm:text-2xl text-ink tracking-tight">
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
 * The title row of a page header band, as flex items for a `flex flex-wrap items-center` parent:
 * the `h1`, then (desktop) a divider and the area's section tabs, then the actions on the right,
 * kept clear of the floating search pill. On phones the tabs drop to their own row under the
 * title. Shared by `HudTitlePanel` and the Character page, which builds its band by hand.
 */
export function BandHeadingRow({
  title,
  sections,
  sectionsBelow = false,
  actions,
  actionsBelowOnPhone = false,
  clearPill = true,
  titleClassName,
  titleAs: TitleTag = 'h1',
}: {
  title: React.ReactNode
  sections?: React.ReactNode
  sectionsBelow?: boolean
  actions?: React.ReactNode
  actionsBelowOnPhone?: boolean
  /** Leave room for the pill that straddles the panel's top-right corner (desktop). */
  clearPill?: boolean
  titleClassName?: string
  titleAs?: 'h1' | 'p'
}) {
  return (
    <>
      <TitleTag
        className={cn(
          'hud-band-title order-1 min-w-0 font-grotesk font-semibold text-xl sm:text-2xl text-ink tracking-tight',
          titleClassName,
        )}
      >
        {title}
      </TitleTag>
      {sections && !sectionsBelow ? (
        <span aria-hidden="true" className="order-2 hidden md:block h-5 w-px shrink-0 bg-line" />
      ) : null}
      {sections ? (
        <div
          className={cn(
            'hud-band-sections order-5 basis-full min-w-0',
            !sectionsBelow && 'is-inline md:order-3 md:basis-0 md:flex-1',
          )}
        >
          {sections}
        </div>
      ) : null}
      {actions ? (
        <div
          className={cn(
            'order-4 ml-auto flex max-w-full flex-wrap items-center gap-2.5',
            actionsBelowOnPhone && 'max-md:order-6 max-md:basis-full max-md:ml-0',
          )}
        >
          {actions}
        </div>
      ) : null}
      {clearPill ? <span aria-hidden="true" className="hud-pill-clear order-4" /> : null}
    </>
  )
}

/**
 * First row of a page header band: crumbs or section tabs, pulled up to the panel's top edge so
 * they sit level with the search pill. The page's band (`joined`) follows directly below.
 */
export function HudTitleBandTop({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('hud-title-band-top bg-surface-2', className)}>{children}</div>
}
