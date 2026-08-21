import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import {
  LaunchpadCarouselGhost,
  DailyRoutineGhost,
  DashboardNewsGhost,
  SubterraneanHubGhost,
  ActivityFeedGhost,
  HudWorkspaceGhost,
} from './HudGhostSkeletons'

describe('HudGhostSkeletons Composite Views', () => {
  it('renders LaunchpadCarouselGhost without crashing', () => {
    const { container } = render(<LaunchpadCarouselGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders DailyRoutineGhost without crashing', () => {
    const { container } = render(<DailyRoutineGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders DashboardNewsGhost without crashing', () => {
    const { container } = render(<DashboardNewsGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders SubterraneanHubGhost without crashing', () => {
    const { container } = render(<SubterraneanHubGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders ActivityFeedGhost without crashing', () => {
    const { container } = render(<ActivityFeedGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders HudWorkspaceGhost without crashing', () => {
    const { container } = render(<HudWorkspaceGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

