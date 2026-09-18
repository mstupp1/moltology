import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemberSearchRow } from './MemberSearchRow'
import type { MemberSearchResult } from '@/lib/connections'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}))

vi.mock('@/components/hud/member/FriendRequestButton', () => ({
  FriendRequestButton: () => <button type="button">Request</button>,
}))

const member: MemberSearchResult = {
  id: 'row-1',
  larvaId: 'LARVA UNIT #9',
  handle: 'nearby_one',
  displayName: 'nearby_one',
  stage: 1,
  stageLabel: 'Larval Initiate',
  avatarConfig: { style: 'critters', seed: 'nearby-row' },
}

describe('MemberSearchRow', () => {
  it('renders a static close-up portrait and does not mount animated full-body', () => {
    render(
      <MemberSearchRow
        member={member}
        relationship="none"
        pendingRequestId={null}
      />
    )

    expect(screen.getByTestId('lobster-avatar-portrait')).toBeInTheDocument()
    const img = screen.getByTestId('lobster-avatar-portrait-image')
    expect(img).toBeInTheDocument()
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('data-avatar-slot="portrait"')
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
    expect(screen.queryByTestId('lobster-avatar-full-body')).toBeNull()
  })
})
