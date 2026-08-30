import React from 'react'
import { cn } from '@/lib/utils'
import { MARKET_TABS, type MarketTab } from './market-data'

interface MarketShopTabsProps {
  activeTab: MarketTab
  onTabChange: (tab: MarketTab) => void
}

export function MarketShopTabs({ activeTab, onTabChange }: MarketShopTabsProps) {
  return (
    <div className="chitin-card p-1 sm:p-1.5 chamfer-corner shadow-xl">
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
                'relative px-2 py-2.5 sm:py-3 rounded-sm text-center transition-all touch-manipulation',
                isActive
                  ? 'bg-gradient-to-b from-[#00c3ff]/20 to-[#00c3ff]/5 border border-[#00c3ff]/60 shadow-[0_0_14px_rgba(0,195,255,0.2)]'
                  : 'bg-[#050808]/60 border border-transparent hover:border-[#3a4a49] hover:bg-[#0a1010]'
              )}
            >
              <span
                className={cn(
                  'block font-grotesk text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                  isActive ? 'text-[#00c3ff]' : 'text-[#839493]'
                )}
              >
                {tab.label}
              </span>
              <span className="hidden sm:block text-[9px] text-[#839493] mt-0.5 leading-tight">
                {tab.hint}
              </span>
              {isActive ? (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#00c3ff] rounded-full" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
