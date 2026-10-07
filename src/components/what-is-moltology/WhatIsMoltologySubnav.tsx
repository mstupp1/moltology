import React, { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { usePublicHeaderChrome } from '@/components/public-header-chrome'
import { WHAT_IS_MOLTOLOGY_NAV, resolveWhatIsMoltologyNavId } from './nav'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export const WhatIsMoltologySubnav: React.FC = () => {
  const { height: headerHeight, visible } = usePublicHeaderChrome()
  const navRef = React.useRef<HTMLElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const [barHeight, setBarHeight] = useState(0)

  let pathname = '/what-is-moltology'
  try {
    pathname = useLocation()?.pathname || pathname
  } catch {
    // router context not yet ready
  }

  const activeId = resolveWhatIsMoltologyNavId(pathname)
  const offset = visible ? headerHeight : 0

  useIsomorphicLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().height)
      setBarHeight((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
  }, [activeId])

  return (
    <>
      <div aria-hidden="true" style={{ height: headerHeight + barHeight }} />
      <nav
        ref={navRef}
        aria-label="About Moltology sections"
        className="story-subnav fixed top-0 left-0 right-0 z-40 border-b transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div className="story-wrap">
          <ul ref={listRef} className="flex gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {WHAT_IS_MOLTOLOGY_NAV.map((item) => {
              const active = item.id === activeId
              return (
                <li key={item.id} className="shrink-0">
                  <Link
                    to={item.path}
                    className={`story-subnav-link inline-flex items-center min-h-11 px-3.5 text-xs sm:text-sm font-grotesk transition-colors ${
                      active
                        ? 'text-[#bcf5dc]'
                        : 'text-[#9aadb0] hover:text-[#f2f0e9]'
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
    </>
  )
}
