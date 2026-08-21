import React, { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

/**
 * Standard, lightweight top loading progress bar for page transitions.
 * Shows a subtle benthic cyan neon progress line at the very top of the screen
 * whenever router navigation is pending.
 */
export function HUDTopLoadingBar() {
  const isLoading = useRouterState({
    select: (s) => s.status === 'pending' || s.isLoading,
  })
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let timer: any
    if (isLoading) {
      setVisible(true)
      setProgress(20)
      timer = setTimeout(() => {
        setProgress(75)
      }, 80)
    } else {
      setProgress(100)
      timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)
    }
    return () => clearTimeout(timer)
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="Loading page"
      data-testid="hud-top-loading-bar"
    >
      <div
        className="h-full bg-gradient-to-r from-[#00c3ff] via-[#00ffff] to-[#00c3ff] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 8px rgba(0,255,255,0.8), 0 0 16px rgba(0,195,255,0.5)',
        }}
      />
    </div>
  )
}
