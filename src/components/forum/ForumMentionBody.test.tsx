import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForumMentionBody } from './ForumMentionBody'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

describe('ForumMentionBody', () => {
  it('renders @handle tokens as dossier links', () => {
    render(<ForumMentionBody content="Ask @claw_lord before you molt." />)

    const link = screen.getByTestId('forum-mention-link')
    expect(link).toHaveTextContent('@claw_lord')
    expect(link).toHaveAttribute('href', '/member/claw_lord')
    expect(screen.getByText(/Ask/)).toBeInTheDocument()
    expect(screen.getByText(/before you molt/)).toBeInTheDocument()
  })

  it('leaves copy without designations as ordinary text', () => {
    render(<ForumMentionBody content="No one was hailed here." />)
    expect(screen.queryByTestId('forum-mention-link')).not.toBeInTheDocument()
    expect(screen.getByText('No one was hailed here.')).toBeInTheDocument()
  })
})
