import React, { createRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  InlineTopicComposer,
  InlineTopicComposerHandle,
} from './InlineTopicComposer'
import { ForumShell } from './ForumShell'
import { authClient } from '@/lib/auth-client'
import { createForumTopicFn, ForumCategoryEntry } from '@/lib/server/api'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  createForumTopicFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-token'),
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="auth-modal">Auth Modal</div> : null,
}))

const mockCategories: ForumCategoryEntry[] = [
  {
    id: 'cat-1',
    name: 'General Discussion',
    slug: 'general-discussion',
    description: 'General',
    topicCount: 5,
    color: '#00ffff',
    icon: 'MessageSquare',
    sortOrder: 1,
  },
  {
    id: 'cat-2',
    name: 'Carapace Tuning',
    slug: 'carapace-tuning',
    description: 'Tuning',
    topicCount: 3,
    color: '#ffaa00',
    icon: 'Terminal',
    sortOrder: 2,
  },
]

describe('InlineTopicComposer', () => {
  const onCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'test-user-1', name: 'MoltInitiate' } },
    } as any)
  })

  it('renders collapsed state when authenticated', () => {
    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    expect(screen.getByTestId('inline-composer-collapsed')).toBeInTheDocument()
    expect(screen.getByText(/transmit a new discussion frequency/i)).toBeInTheDocument()
  })

  it('expands into full form on click with mobile-safe input sizes', () => {
    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    fireEvent.click(screen.getByTestId('inline-composer-collapsed'))

    expect(screen.getByTestId('inline-composer-expanded')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()

    // Mobile viewport verification: font size 16px to prevent iOS Safari auto-zoom
    const titleInput = screen.getByLabelText(/title/i)
    expect(titleInput.className).toContain('text-[16px]')

    const contentTextarea = screen.getByLabelText(/content/i)
    expect(contentTextarea.className).toContain('text-[16px]')
  })

  it('collapses back when Cancel is clicked', () => {
    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    fireEvent.click(screen.getByTestId('inline-composer-collapsed'))
    expect(screen.getByTestId('inline-composer-expanded')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByTestId('inline-composer-collapsed')).toBeInTheDocument()
    expect(screen.queryByTestId('inline-composer-expanded')).not.toBeInTheDocument()
  })

  it('respects fixedCategory when inside a board', () => {
    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          initialCategoryId="cat-2"
          fixedCategory={true}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    fireEvent.click(screen.getByTestId('inline-composer-collapsed'))
    expect(screen.getByTestId('inline-composer-expanded')).toBeInTheDocument()
    expect(screen.getByText('CARAPACE TUNING')).toBeInTheDocument()
  })

  it('validates minimum length before enabling transmit', async () => {
    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    fireEvent.click(screen.getByTestId('inline-composer-collapsed'))

    const transmitButton = screen.getByRole('button', { name: /transmit post/i })
    expect(transmitButton).toBeDisabled()

    // Enter title < 5 chars
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Hi' } })
    expect(transmitButton).toBeDisabled()

    // Enter title >= 5 chars but content < 10 chars
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid Title Here' } })
    fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'Short' } })
    expect(transmitButton).toBeDisabled()

    // Enter content >= 10 chars
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'This is a sufficiently long message body.' },
    })
    expect(transmitButton).toBeEnabled()
  })

  it('submits topic and resets form on successful transmission', async () => {
    const mockCreatedTopic = {
      id: 'topic-99',
      title: 'Valid New Topic',
      content: 'This is a sufficiently long message body.',
      slug: 'valid-new-topic',
      categorySlug: 'general-discussion',
    }
    vi.mocked(createForumTopicFn).mockResolvedValueOnce(mockCreatedTopic as any)

    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    fireEvent.click(screen.getByTestId('inline-composer-collapsed'))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid New Topic' } })
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'This is a sufficiently long message body.' },
    })

    const transmitButton = screen.getByRole('button', { name: /transmit post/i })
    fireEvent.click(transmitButton)

    await waitFor(() => {
      expect(createForumTopicFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Valid New Topic',
            content: 'This is a sufficiently long message body.',
            userId: 'test-user-1',
          }),
        })
      )
      expect(onCreated).toHaveBeenCalledWith(mockCreatedTopic)
    })

    // After success, it should collapse back to prompt
    expect(screen.getByTestId('inline-composer-collapsed')).toBeInTheDocument()
  })

  it('renders guest banner when unauthenticated and opens auth modal on click', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    render(
      <ForumShell>
        <InlineTopicComposer
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    expect(screen.getByTestId('inline-composer-guest')).toBeInTheDocument()
    expect(screen.getByText('Join the Discussion')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sign in \/ join/i }))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
  })

  it('exposes expandAndFocus via ref handle', async () => {
    const composerRef = createRef<InlineTopicComposerHandle>()

    render(
      <ForumShell>
        <InlineTopicComposer
          ref={composerRef}
          categories={mockCategories}
          onCreated={onCreated}
        />
      </ForumShell>
    )

    expect(screen.getByTestId('inline-composer-collapsed')).toBeInTheDocument()

    // Trigger expand imperatively
    composerRef.current?.expandAndFocus()

    await waitFor(() => {
      expect(screen.getByTestId('inline-composer-expanded')).toBeInTheDocument()
    })
  })
})
