import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { LocalTime } from './LocalTime'
import { formatDay, formatDayTime } from '@/lib/dates'
import { relativeTime } from '@/lib/forum-utils'

// 02:30 UTC on Sep 11 is still Sep 10 in New York: the case that broke hydration.
const LATE_EVENING_ET = '2026-09-11T02:30:00.000Z'

describe('LocalTime', () => {
  const originalTz = process.env.TZ
  let root: Root | null = null
  let container: HTMLDivElement

  beforeEach(() => {
    process.env.TZ = 'America/New_York'
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = null
    container.remove()
    process.env.TZ = originalTz
  })

  async function hydrate(element: React.ReactElement) {
    container.innerHTML = renderToString(element)
    const serverText = container.textContent
    const onRecoverableError = vi.fn()
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError })
    })
    return { serverText, onRecoverableError }
  }

  it('renders the UTC day on the server, hydrates cleanly, then shows the local day', async () => {
    const { serverText, onRecoverableError } = await hydrate(<LocalTime value={LATE_EVENING_ET} />)

    expect(serverText).toBe('Sep 11, 2026')
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toBe('Sep 10, 2026')
    expect(container.querySelector('time')).toHaveAttribute('datetime', LATE_EVENING_ET)
  })

  it('hydrates relative labels and hover titles without a mismatch', async () => {
    const { onRecoverableError } = await hydrate(
      <LocalTime value={LATE_EVENING_ET} format={relativeTime} titleFormat={formatDayTime} />,
    )

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector('time')?.getAttribute('title')).toBe(formatDayTime(LATE_EVENING_ET))
  })
})

describe('date helpers', () => {
  it('formats in the requested zone and ignores invalid input', () => {
    expect(formatDay(LATE_EVENING_ET, 'UTC')).toBe('Sep 11, 2026')
    expect(formatDay(LATE_EVENING_ET, 'America/New_York')).toBe('Sep 10, 2026')
    expect(formatDay('not a date')).toBe('')
    expect(formatDayTime('nope')).toBe('')
  })
})
