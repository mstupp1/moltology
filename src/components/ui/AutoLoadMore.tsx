import React, { useEffect, useRef, useState } from 'react'
import { HUDSpinner } from './HUDSpinner'
import { LoadMoreButton } from './LoadMoreButton'

export interface AutoLoadMoreProps {
  /** Loads the next page. A rejected promise shows a "Try again" button instead of retrying on its own. */
  onLoad: () => Promise<unknown> | void
  loading: boolean
  /** Fallback button label, shown only after a failed load or where the browser cannot watch scrolling. */
  label?: string
  /** How early to start loading, in pixels before the end of the list comes into view. */
  distance?: number
  className?: string
  testId?: string
}

/**
 * The element that scrolls this list. The app shell scrolls an inner panel, not
 * the window, and an observer watching the window would only see the end of the
 * list once it was already on screen, so loading would start late.
 */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = window.getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return el
  }
  return null
}

/**
 * Endless scroll for a list that pages in from the server. Render it after the
 * last row only while another page exists. The next page loads on its own as the
 * reader nears the end; a short page that leaves the end on screen keeps loading
 * until it fills the screen or runs out.
 */
export function AutoLoadMore({
  onLoad,
  loading,
  label = 'Load more',
  distance = 600,
  className = '',
  testId,
}: AutoLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad
  const [failed, setFailed] = useState(false)
  const [canWatch, setCanWatch] = useState(true)

  const run = () => {
    setFailed(false)
    try {
      const result = onLoadRef.current()
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        ;(result as Promise<unknown>).catch(() => setFailed(true))
      }
    } catch {
      setFailed(true)
    }
  }
  const runRef = useRef(run)
  runRef.current = run

  // A fresh observer after every load reports straight away whether the end is
  // still on screen, so short pages keep filling without another scroll.
  useEffect(() => {
    if (loading || failed) return
    const node = sentinelRef.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setCanWatch(false)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          runRef.current()
        }
      },
      { root: scrollParent(node), rootMargin: `${distance}px 0px` },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loading, failed, distance])

  return (
    <div className={className} data-testid={testId}>
      <div ref={sentinelRef} aria-hidden="true" />
      {failed || !canWatch ? (
        <LoadMoreButton
          label={failed ? 'Try again' : label}
          loading={loading}
          testId={testId ? `${testId}-button` : undefined}
          onClick={run}
        />
      ) : loading ? (
        <div className="flex justify-center py-3">
          <HUDSpinner size="xs" variant="neutral" aria-label="Loading more" />
        </div>
      ) : null}
    </div>
  )
}
