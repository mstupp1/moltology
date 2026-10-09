import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('utils.ts', () => {
  describe('cn (classname merge)', () => {
    it('treats the custom radius and shadow tokens as overridable', () => {
      expect(cn('rounded-control', 'rounded-none')).toBe('rounded-none')
      expect(cn('rounded-card', 'rounded-panel')).toBe('rounded-panel')
      expect(cn('shadow-sheen-inset', 'shadow-none')).toBe('shadow-none')
    })

    it('merges class names correctly', () => {
      const result = cn('bg-red-500', 'text-white', { 'p-4': true, 'm-2': false })
      expect(result).toBe('bg-red-500 text-white p-4')
    })

    it('handles conflicting tailwind classes', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })
  })

  describe('formatCurrency', () => {
    it('formats positive numbers as USD currency', () => {
      expect(formatCurrency(19.99)).toBe('$19.99')
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })
})
