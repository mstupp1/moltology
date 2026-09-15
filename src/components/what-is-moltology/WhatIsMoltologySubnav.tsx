import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { WHAT_IS_MOLTOLOGY_NAV, resolveWhatIsMoltologyNavId } from './nav'

export const WhatIsMoltologySubnav: React.FC = () => {
  let pathname = '/what-is-moltology'
  try {
    pathname = useLocation()?.pathname || pathname
  } catch {
    // router context not yet ready
  }

  const activeId = resolveWhatIsMoltologyNavId(pathname)

  return (
    <nav
      aria-label="About Moltology sections"
      className="sticky top-[4.5rem] z-30 border-b border-cyan-900/40 bg-[#020408]/90 backdrop-blur-md"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
          {WHAT_IS_MOLTOLOGY_NAV.map((item) => {
            const active = item.id === activeId
            return (
              <li key={item.id} className="shrink-0">
                <Link
                  to={item.path}
                  className={`inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-grotesk font-bold tracking-wide transition-colors rounded-lg ${
                    active
                      ? 'text-cyan-200 bg-cyan-950/50 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-transparent'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
