import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityFeedItem } from './ActivityFeedItem'
import type { ActivityEventView } from '@/lib/activity-events'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, hash, ...props }: any) => {
    const path = typeof to === 'string' ? to : '/'
    const resolved = path
      .replace('$categorySlug', params?.categorySlug ?? '')
      .replace('$topicSlug', params?.topicSlug ?? '')
      .replace('$profileId', params?.profileId ?? '')
      .replace(/\/+$/, '')
    const href = hash ? `${resolved}#${hash}` : resolved
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: ({ animated }: { animated?: boolean }) => (
    <div data-testid="avatar" data-animated={animated ? 'yes' : 'no'} />
  ),
}))

function event(overrides: Partial<ActivityEventView> = {}): ActivityEventView {
  return {
    id: 'evt-1',
    kind: 'forum_reply_posted',
    category: 'COMMUNITY',
    categoryLabel: 'Community',
    title: 'Hold the quiet',
    detail: 'Replied on General Discussion.',
    valueBadge: 'Reply',
    occurredAt: '2026-08-27T17:46:00.000Z',
    occurredLabel: '14 minutes ago',
    visibility: 'friends',
    href: '/forum/general-discussion/hold-the-quiet#post-post-1',
    metadata: { categoryName: 'General Discussion', mentionedHandles: ['shell_sib'] },
    actor: {
      id: 'friend-1',
      displayName: 'claw_lord',
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #2',
      stage: 2,
      avatarConfig: null,
    },
    isOwn: false,
    highlight: true,
    ...overrides,
  }
}

describe('ActivityFeedItem', () => {
  it('deep-links a friend reply to the thread anchor and keeps the portrait still', () => {
    render(<ActivityFeedItem event={event()} />)

    expect(screen.getByRole('heading', { name: 'Hold the quiet' }).closest('a')).toHaveAttribute(
      'href',
      '/forum/general-discussion/hold-the-quiet#post-post-1'
    )
    expect(screen.getByText('claw_lord').closest('a')).toHaveAttribute('href', '/member/claw_lord')
    expect(screen.getByText('shell_sib')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-animated', 'no')
  })

  it('deep-links a sealed liturgy to the alignment hub', () => {
    render(
      <ActivityFeedItem
        event={event({
          kind: 'routine_completed',
          category: 'ROUTINES',
          categoryLabel: 'Liturgy',
          title: 'Silent Synchronization sealed',
          detail: 'The 05:30 liturgy is complete.',
          href: '/dashboard#daily-routine-hub',
          metadata: { time: '05:30' },
        })}
      />
    )

    expect(screen.getByRole('heading', { name: 'Silent Synchronization sealed' }).closest('a')).toHaveAttribute(
      'href',
      '/dashboard#daily-routine-hub'
    )
  })

  it('deep-links a welcomed connection to the peer dossier', () => {
    render(
      <ActivityFeedItem
        event={event({
          kind: 'connection_accepted',
          category: 'CONNECTIONS',
          categoryLabel: 'Circle',
          title: 'Circle widened',
          detail: 'Connected with shell_sib.',
          href: '/member/shell_sib',
          metadata: { peerName: 'shell_sib' },
        })}
      />
    )

    expect(screen.getByRole('heading', { name: 'Circle widened' }).closest('a')).toHaveAttribute(
      'href',
      '/member/shell_sib'
    )
  })
})
