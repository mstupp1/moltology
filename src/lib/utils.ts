import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the custom radius and shadow tokens in tailwind.config.js,
// so a caller's `rounded-none` or `shadow-none` still overrides a primitive's default.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['chip', 'control', 'card', 'panel'],
      shadow: ['menu', 'sheen-inset', 'field-focus', 'field-error', 'hud-cyan', 'hud-cyan-lg', 'hud-red', 'hud-red-lg', 'sacred-red', 'chitin-plate'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
