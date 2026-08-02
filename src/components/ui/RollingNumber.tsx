import React, { useState, useEffect, useRef } from 'react'

export interface RollingNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef<number>(0)

  useEffect(() => {
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
  }, [value, duration])

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
