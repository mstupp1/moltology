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

  it('renders bold, italic, code, and links', () => {
    render(
      <ForumPostBody content="This is **bold**, this is *italic*, here is `inline_code`, and [Website](https://moltology.com)." />,
    )
    expect(screen.getByText('bold')).toHaveClass('font-bold')
    expect(screen.getByText('italic')).toHaveClass('italic')
    expect(screen.getByText('inline_code')).toHaveClass('font-mono')
    const link = screen.getByRole('link', { name: 'Website' })
    expect(link).toHaveAttribute('href', 'https://moltology.com/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('nofollow')
  })

  it('renders lists and code blocks', () => {
    const { container } = render(<ForumPostBody content={'- one\n- two\n\n3. three\n\n```\nconst a = 1\n```'} />)
    expect(container.querySelectorAll('ul > li')).toHaveLength(2)
    expect(container.querySelector('ol')).toHaveAttribute('start', '3')
    expect(container.querySelector('pre')).toHaveTextContent('const a = 1')
  })

  it('keeps single line breaks', () => {
    const { container } = render(<ForumPostBody content={'line one\nline two'} />)
    expect(container.querySelectorAll('br')).toHaveLength(1)
  })

  it('never renders script links', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,hi', 'vbscript:x', '//evil.com', 'https://a.com@evil.com']) {
      const { container, unmount } = render(<ForumPostBody content={`[click](${href})`} />)
      expect(container.querySelector('a')).toBeNull()
      expect(container).toHaveTextContent('click')
      unmount()
    }
  })

  it('shows raw HTML as text instead of rendering it', () => {
    const { container } = render(
      <ForumPostBody content={'<img src=x onerror="alert(1)"> <script>alert(1)</script>\n\n<div onclick="x">block</div>'} />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('[onclick]')).toBeNull()
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)">')
  })

  it('shows images as links instead of loading them', () => {
    const { container } = render(<ForumPostBody content="![diagram](https://e.com/p.png)" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('link', { name: 'diagram' })).toHaveAttribute('href', 'https://e.com/p.png')
  })

  it('does not link mentions inside code or links', () => {
    render(<ForumPostBody content="`@claw_lord` and [@pincer_prime](https://e.com)" />)
    expect(screen.queryByTestId('forum-mention-link')).not.toBeInTheDocument()
  })

  it('ends a quote at the first unquoted line', () => {
    render(<ForumPostBody content={'> @claw_lord held:\n> quoted\nmy answer'} />)
    expect(screen.getByTestId('forum-quote-block')).not.toHaveTextContent('my answer')
    expect(screen.getByText('my answer')).toBeInTheDocument()
  })
})
