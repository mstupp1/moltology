import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForumPostBody } from './ForumPostBody'
import { FORUM_QUOTE_WITHDRAWN_BODY } from '@/lib/forum-quotes'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

describe('ForumPostBody', () => {
  it('renders quote chrome with a handle attribution and mention links inside', () => {
    render(
      <ForumPostBody content={'> @claw_lord held:\n> Ask @pincer_prime before you molt.\n\nI agree.'} />,
    )

    const quote = screen.getByTestId('forum-quote-block')
    expect(quote).toBeInTheDocument()
    expect(screen.getByTestId('forum-quote-attribution')).toHaveTextContent('@claw_lord held')
    expect(screen.getByRole('link', { name: '@claw_lord' })).toHaveAttribute('href', '/member/claw_lord')
    expect(screen.getByRole('link', { name: '@pincer_prime' })).toHaveAttribute('href', '/member/pincer_prime')
    expect(screen.getByText('I agree.')).toBeInTheDocument()
  })

  it('renders a tombstone quote without treating it as live copy', () => {
    render(
      <ForumPostBody content={`> Architect Vaelen held:\n> ${FORUM_QUOTE_WITHDRAWN_BODY}\n`} />,
    )
    expect(screen.getByTestId('forum-quote-block')).toHaveTextContent(FORUM_QUOTE_WITHDRAWN_BODY)
    expect(screen.getByText('Architect Vaelen')).toBeInTheDocument()
  })

  it('leaves copy without quotes as ordinary mention text', () => {
    render(<ForumPostBody content="Ask @claw_lord before you molt." />)
    expect(screen.queryByTestId('forum-quote-block')).not.toBeInTheDocument()
    expect(screen.getByTestId('forum-mention-link')).toHaveTextContent('@claw_lord')
  })
})
