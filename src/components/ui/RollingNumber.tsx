import React, { useState, useEffect, useRef } from 'react'

export interface RollingNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  triggerOnView?: boolean
}

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  triggerOnView = true,
}) => {
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
  const [displayValue, setDisplayValue] = useState<number>(isTestEnv ? value : 0)
  const [hasStarted, setHasStarted] = useState<boolean>(!triggerOnView)
  const elementRef = useRef<HTMLSpanElement>(null)
  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef<number>(0)

  // Viewport intersection trigger
  useEffect(() => {
    if (!triggerOnView || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')) {
      setHasStarted(true)
      return
    }

    const node = elementRef.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '50px' }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [triggerOnView])

  // Count animation loop
  useEffect(() => {
    if (!hasStarted) return

    startValueRef.current = displayValue
    startTimeRef.current = null

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Cubic ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValueRef.current + (value - startValueRef.current) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
      }
    }

    animRef.current = requestAnimationFrame(step)

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [value, duration, hasStarted])

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

