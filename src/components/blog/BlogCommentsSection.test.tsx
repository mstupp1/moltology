import React from 'react'
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

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/components/TurnstileWidget', () => ({
  TurnstileWidget: React.forwardRef(({ onVerify }: { onVerify?: (token: string) => void }, _ref) => {
    React.useEffect(() => {
      onVerify?.('turnstile-ok')
    }, [onVerify])
    return <div data-testid="turnstile-widget" />
  }),
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

    expect(screen.getByRole('heading', { name: /Comments/ })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Sign in to join the discussion.')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Sign in / Join' })).toBeInTheDocument()
    expect(screen.getByText('This transmission was profoundly enlightening.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Initiate #99' })).toHaveAttribute('href', '/member/user-1')
  })

  it('holds the lock box for the first-paint empty session shape', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    expect(screen.getByTestId('blog-comments-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Sign in to join the discussion.')).not.toBeInTheDocument()
  })

  it('renders interactive HUD comment form when user is authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-1', name: 'Ascendant Pilot', email: 'pilot@benthic.org' },
      },
    } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    fireEvent.click(await screen.findByTestId('blog-comment-open'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Post comment/i })).toBeInTheDocument()
    })
  })

  it('enforces character minimum guardrail error on submit', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-1', name: 'Ascendant Pilot', email: 'pilot@benthic.org' },
      },
    } as any)

    render(<ToastProvider><BlogCommentsSection postId="post-100" /></ToastProvider>)

    fireEvent.click(await screen.findByTestId('blog-comment-open'))
    const textarea = await screen.findByPlaceholderText('Write a comment...')
    fireEvent.change(textarea, { target: { value: 'hi' } })

    const transmitBtn = screen.getByRole('button', { name: /Post comment/i })
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

    fireEvent.click(await screen.findByTestId('blog-comment-open'))
    const textarea = await screen.findByPlaceholderText('Write a comment...')
    fireEvent.change(textarea, { target: { value: 'A thrilling bio-silicon perspective!' } })

    const submitBtn = screen.getByRole('button', { name: /Post comment/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(createBlogCommentFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId: 'post-100',
          content: 'A thrilling bio-silicon perspective!',
          userId: 'usr-1',
          turnstileToken: 'turnstile-ok',
        }),
      })
      expect(screen.getByText('A thrilling bio-silicon perspective!')).toBeInTheDocument()
      expect(screen.getByText('Comment posted.')).toBeInTheDocument()
    })
  })
})
