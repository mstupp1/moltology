import React from 'react'
import { cn } from '@/lib/utils'
import { MARKET_TABS, type MarketTab } from './market-data'

interface MarketShopTabsProps {
  activeTab: MarketTab
  onTabChange: (tab: MarketTab) => void
}

export function MarketShopTabs({ activeTab, onTabChange }: MarketShopTabsProps) {
  return (
    <div className="border-b border-line-subtle">
      <div
        className="grid grid-cols-3 gap-1"
        role="tablist"
        aria-label="Market shop sections"
      >
        {MARKET_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                '-mb-px px-2 py-2.5 sm:py-3 rounded-t-control border-b-2 text-center transition-colors duration-200 touch-manipulation',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                isActive
                  ? 'bg-surface-2 border-cyan-glow'
                  : 'border-transparent hover:bg-surface-2'
              )}
            >
              <span
                className={cn(
                  'block font-grotesk text-[11px] sm:text-xs font-bold uppercase tracking-[0.08em]',
                  isActive ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {tab.label}
              </span>
              <span className="hidden sm:block text-[11px] text-ink-muted mt-0.5 leading-tight">
                {tab.hint}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
