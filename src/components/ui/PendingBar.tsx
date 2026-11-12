import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Stand-in for a short line of account data that has not loaded yet (a stage name,
 * a count, a balance). It takes the text's place at roughly the text's size, with the
 * same soft pulse as a loading character still, so nothing shows a default that then
 * changes. Size it to the final content: `width` in ch or px, height follows the font.
 */
export function PendingBar({
  width = '6ch',
  className,
  label = 'Loading',
}: {
  width?: string | number
  className?: string
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      data-testid="pending-bar"
      className={cn(
        'inline-block align-middle h-[0.8em] max-w-full rounded-chip bg-white/[0.07] animate-pulse motion-reduce:animate-none',
        className,
      )}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    />
  )
}

/** Fades account content in when it replaces a placeholder (no motion when reduced). */
export const REVEAL_CLASS = 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300'
