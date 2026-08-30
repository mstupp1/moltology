import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BlogCommentsSection } from './BlogCommentsSection'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { getBlogCommentsFn, createBlogCommentFn } from '@/lib/server/api'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  getBlogCommentsFn: vi.fn(),
  createBlogCommentFn: vi.fn(),
}))

describe('BlogCommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getBlogCommentsFn).mockResolvedValue([
      {
        id: 'comment-1',
        postId: 'post-100',
        userId: 'user-1',
        authorName: 'Initiate #99',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 2,
        content: 'This transmission was profoundly enlightening.',
        createdAt: '2026-08-03T12:00:00Z',
      },
    ])
  })

  it('renders guest authorization lock box when user is unauthenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    expect(screen.getByText('COMMUNICATIONS LOG')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('AUTHENTICATION REQUIRED TO JOIN DISCUSSION')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /REGISTER INITIATE/i })).toBeInTheDocument()
    expect(screen.getByText('This transmission was profoundly enlightening.')).toBeInTheDocument()
  })

  it('holds the lock box for the first-paint empty session shape', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    expect(screen.getByTestId('blog-comments-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('AUTHENTICATION REQUIRED TO JOIN DISCUSSION')).not.toBeInTheDocument()
  })

  it('renders interactive HUD comment form when user is authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-1', name: 'Ascendant Pilot', email: 'pilot@benthic.org' },
      },
    } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    await waitFor(() => {
      expect(screen.getByText('Ascendant Pilot')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Log your thoughts or synaptic telemetry.../i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /TRANSMIT COMMENT/i })).toBeInTheDocument()
    })
  })

  it('enforces character minimum guardrail error on submit', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-1', name: 'Ascendant Pilot', email: 'pilot@benthic.org' },
      },
    } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Log your thoughts/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/Log your thoughts/i)
    fireEvent.change(textarea, { target: { value: 'hi' } })

    const transmitBtn = screen.getByRole('button', { name: /TRANSMIT COMMENT/i })
    expect(transmitBtn).toBeDisabled()
  })

  it('submits valid comment successfully for registered user', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-1', name: 'Ascendant Pilot', email: 'pilot@benthic.org' },
      },
    } as any)

    vi.mocked(createBlogCommentFn).mockResolvedValue({
      id: 'comment-new',
      postId: 'post-100',
      userId: 'usr-1',
      authorName: 'Ascendant Pilot',
      authorAvatar: '/images/stage1_larva.png',
      authorStage: 4,
      content: 'A thrilling bio-silicon perspective!',
      createdAt: new Date().toISOString(),
    })

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Log your thoughts/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/Log your thoughts/i)
    fireEvent.change(textarea, { target: { value: 'A thrilling bio-silicon perspective!' } })

    const submitBtn = screen.getByRole('button', { name: /TRANSMIT COMMENT/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(createBlogCommentFn).toHaveBeenCalledWith({
        data: {
          postId: 'post-100',
          content: 'A thrilling bio-silicon perspective!',
          userId: 'usr-1',
        },
      })
      expect(screen.getByText('A thrilling bio-silicon perspective!')).toBeInTheDocument()
      expect(screen.getByText('Comment posted. Your voice carries in the deep.')).toBeInTheDocument()
    })
  })
})
