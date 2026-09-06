import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { MentionTextarea } from './MentionTextarea'
import { searchMembersFn } from '@/lib/server/api'
import { MEMBER_SEARCH_DEBOUNCE_MS } from '@/lib/member-search'

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/api', () => ({
  searchMembersFn: vi.fn(),
}))

function Probe() {
  const [value, setValue] = useState('')
  return (
    <ToastProvider>
      <MentionTextarea
        aria-label="Reply body"
        value={value}
        onChange={setValue}
        placeholder="Write a reply"
      />
    </ToastProvider>
  )
}

describe('MentionTextarea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(searchMembersFn).mockResolvedValue([
      {
        id: 'member-claw',
        larvaId: 'LARVA UNIT #9',
        handle: 'claw_lord',
        displayName: 'claw_lord',
        stage: 2,
        stageLabel: 'Soft-Shed',
        avatarConfig: null,
      },
    ])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens designation autocomplete on @ and inserts the chosen handle', async () => {
    vi.useFakeTimers()
    render(<Probe />)

    const field = screen.getByLabelText('Reply body') as HTMLTextAreaElement
    fireEvent.change(field, { target: { value: '@', selectionStart: 1, selectionEnd: 1 } })
    field.setSelectionRange(1, 1)
    fireEvent.select(field)

    expect(screen.getByTestId('forum-mention-autocomplete')).toBeInTheDocument()
    expect(screen.getByText(/type a designation to hail them/i)).toBeInTheDocument()

    fireEvent.change(field, { target: { value: '@cla', selectionStart: 4, selectionEnd: 4 } })
    field.setSelectionRange(4, 4)
    fireEvent.select(field)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MEMBER_SEARCH_DEBOUNCE_MS + 5)
    })

    expect(searchMembersFn).toHaveBeenCalled()
    const option = screen.getByTestId('forum-mention-option')
    expect(option).toHaveTextContent('@claw_lord')

    fireEvent.mouseDown(option)
    expect(field.value).toBe('@claw_lord ')
    expect(screen.queryByTestId('forum-mention-autocomplete')).not.toBeInTheDocument()
  })
})
