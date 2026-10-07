import React, { useEffect, useRef } from 'react'

/** Keep server-rendered content readable; enhance entrances only when supported. */
export function StoryReveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined' ||
      typeof node.animate !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let animation: Animation | undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      animation = node.animate([
        { opacity: 0.2, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 850, delay, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' })
      observer.disconnect()
    }, { threshold: 0.08 })
    observer.observe(node)
    return () => { observer.disconnect(); animation?.cancel() }
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
