import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ options: config }),
}))
vi.mock('@/components/hud/DailyRoutineWidget', () => ({ DailyRoutineWidget: () => <div data-testid="daily-alignment-page" /> }))
vi.mock('@/components/hud/HudGhostSkeletons', () => ({ DailyRoutineGhost: () => null }))

import { Route } from './alignment'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'

describe('/alignment route', () => {
  it('renders daily alignment as a dedicated page instead of redirecting', () => {
    const Component = Route.options.component!
    render(<Component />)
    expect(screen.getByTestId('daily-alignment-page')).toBeInTheDocument()
    expect(Route.options.pendingComponent).toBe(DailyRoutineGhost)
    expect(Route.options).not.toHaveProperty('beforeLoad')
  })
})
