import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import {
  DailyRoutineGhost,
  DashboardGhost,
  ActivityFeedGhost,
  HudWorkspaceGhost,
} from './HudGhostSkeletons'

describe('HudGhostSkeletons Composite Views', () => {
  it('renders DailyRoutineGhost without crashing', () => {
    const { container } = render(<DailyRoutineGhost />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders DashboardGhost without crashing', () => {
    const { container } = render(<DashboardGhost />)
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

