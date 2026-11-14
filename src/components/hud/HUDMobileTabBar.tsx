import React from 'react'
import { Lock, MoreHorizontal } from 'lucide-react'
import { OracleCoreGlyph } from '../ai/OracleCoreGlyph'

export interface MobileTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  /** Signed out and the page needs an account: a small lock on the icon. */
  locked?: boolean
}

export interface HUDMobileTabBarProps {
  tabs: MobileTab[]
  /** Id of the tab for the current page, or 'more' when the page lives in the More sheet. */
  activeId: string | null
  moreOpen: boolean
  /** Count shown on More, e.g. waiting friend requests for Profile inside it. */
  moreBadge?: number
  onNavigate: (path: string) => void
  onToggleMore: () => void
  moreButtonRef?: React.Ref<HTMLButtonElement>
  /** The Oracle as a raised synaptic core in the middle of the bar. */
  core?: {
    current: boolean
    onPress: () => void
  }
}

/**
 * Phone navigation: the main pages as a bottom bar drawn like the collapsed
 * desktop rail (icon over a short label, cyan marker on the current page),
 * with the rest of the pages in a More sheet.
 */
export function HUDMobileTabBar({
  tabs,
  activeId,
  moreOpen,
  moreBadge = 0,
  onNavigate,
  onToggleMore,
  moreButtonRef,
  core,
}: HUDMobileTabBarProps) {
  const cell =
    'relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-150 cursor-pointer select-none touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow'

  const renderCell = (
    key: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    current: boolean,
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> },
    badge?: React.ReactNode,
  ) => (
    <button key={key} type="button" className={`${cell} ${current ? 'bg-surface-2' : 'hover:bg-surface-2'}`} {...props}>
      {current && <span aria-hidden className="absolute inset-x-3 top-0 h-[2px] bg-cyan-glow" />}
      <span className="relative inline-flex">
        <Icon className={`w-5 h-5 shrink-0 ${current ? 'text-cyan-glow' : 'text-ink-muted'}`} />
        {badge}
      </span>
      <span
        className={`text-[11px] font-sans font-bold uppercase leading-none truncate max-w-full ${
          current ? 'text-ink' : 'text-ink-muted'
        }`}
      >
        {label}
      </span>
    </button>
  )

  const renderCore = ({ current, onPress }: NonNullable<HUDMobileTabBarProps['core']>) => {
    const isCurrent = current && !moreOpen
    return (
      <button
        key="oracle-core"
        type="button"
        onClick={onPress}
        aria-label="Oracle"
        aria-current={isCurrent ? 'page' : undefined}
        data-testid="mobile-oracle-core"
        className="group relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer select-none touch-manipulation focus-visible:outline-none"
      >
        {/* Raised socket: only its top arc shows above the bar's edge. */}
        <span
          aria-hidden
          className={`absolute left-1/2 -top-[18px] -translate-x-1/2 w-[54px] h-[54px] rounded-full bg-surface-1 border-t transition-colors duration-200 ${
            isCurrent ? 'border-cyan-glow/50' : 'border-line-subtle'
          } group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-cyan-glow`}
        />
        <span className="absolute left-1/2 -top-[14px] -translate-x-1/2 transition-transform duration-150 ease-out group-active:scale-[0.92] motion-reduce:transition-none">
          <OracleCoreGlyph size={46} active={isCurrent} />
        </span>
        {/* Same icon-height spacer as the other cells, so the labels share a baseline. */}
        <span aria-hidden className="w-5 h-5 shrink-0" />
        <span
          className={`relative text-[11px] font-sans font-bold uppercase leading-none ${
            isCurrent ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          ORACLE
        </span>
      </button>
    )
  }

  return (
    <nav
      aria-label="Main"
      data-testid="mobile-tab-bar"
      className="md:hidden order-last shrink-0 relative z-[99991] flex items-stretch h-[calc(var(--hud-tabbar-height)+env(safe-area-inset-bottom,0px))] bg-surface-1 border-t border-line-subtle pb-[env(safe-area-inset-bottom,0px)] font-sans"
    >
      {tabs.map((tab, index) => {
        const current = !moreOpen && activeId === tab.id
        const cellNode = renderCell(
          tab.id,
          tab.label,
          tab.icon,
          current,
          {
            onClick: () => onNavigate(tab.path),
            'aria-current': current ? 'page' : undefined,
            title: tab.locked ? 'Needs an account' : undefined,
          },
          tab.locked ? (
            <Lock
              aria-hidden
              data-testid="guest-lock-icon"
              className="absolute -top-1 -right-2 w-2.5 h-2.5 text-crimson-text/80"
            />
          ) : null,
        )
        // The core sits in the middle: after the first half of the page tabs.
        if (core && index === Math.ceil(tabs.length / 2) - 1) {
          return (
            <React.Fragment key={tab.id}>
              {cellNode}
              {renderCore(core)}
            </React.Fragment>
          )
        }
        return cellNode
      })}
      {renderCell(
        'more',
        'More',
        MoreHorizontal,
        moreOpen || activeId === 'more',
        {
          ref: moreButtonRef,
          onClick: onToggleMore,
          'aria-expanded': moreOpen,
          'aria-haspopup': 'dialog',
          'aria-label':
            moreBadge > 0
              ? `More, ${moreBadge} friend request${moreBadge === 1 ? '' : 's'} waiting`
              : 'More',
        },
        moreBadge > 0 ? (
          <span
            aria-hidden
            data-testid="more-badge"
            className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-cyan-glow text-[11px] font-bold leading-4 text-center text-abyss tabular-nums"
          >
            {moreBadge > 9 ? '9+' : moreBadge}
          </span>
        ) : null,
      )}
    </nav>
  )
}
