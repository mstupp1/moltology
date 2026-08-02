import React, { useEffect, useRef, useState } from 'react'

export interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-left' | 'slide-right'
  delayMs?: number
  durationMs?: number
  threshold?: number
  once?: boolean
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delayMs = 0,
  durationMs = 700,
  threshold = 0.15,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = elementRef.current
    if (!node) return

    // Fallback if IntersectionObserver is not supported
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once) {
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      { threshold }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold, once])

  const getAnimationStyles = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      transitionProperty: 'opacity, transform',
      transitionDuration: `${durationMs}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transitionDelay: `${delayMs}ms`,
    }

    if (!isVisible) {
      style.opacity = 0
      switch (animation) {
        case 'fade-up':
          style.transform = 'translate3d(0, 36px, 0)'
          break
        case 'scale-up':
          style.transform = 'scale(0.92) translate3d(0, 20px, 0)'
          break
        case 'slide-left':
          style.transform = 'translate3d(-40px, 0, 0)'
          break
        case 'slide-right':
          style.transform = 'translate3d(40px, 0, 0)'
          break
        case 'fade-in':
        default:
          style.transform = 'translate3d(0, 0, 0)'
          break
      }
    } else {
      style.opacity = 1
      style.transform = 'translate3d(0, 0, 0) scale(1)'
    }

    return style
  }

  return (
    <div ref={elementRef} className={className} style={getAnimationStyles()}>
      {children}
    </div>
  )
}
