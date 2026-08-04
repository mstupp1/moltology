import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DashboardNewsWidget } from './DashboardNewsWidget'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock server API
vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn().mockResolvedValue([]),
}))

describe('DashboardNewsWidget Component', () => {
  it('renders title, live feed indicator, and desk category filter tabs', () => {
    render(<DashboardNewsWidget />)

    expect(screen.getByText('MOLTNATION INTELLIGENCE & NEWS FEED')).toBeInTheDocument()
    expect(screen.getByText('LIVE FEED')).toBeInTheDocument()
    expect(screen.getByText('OPEN NEWS DESK')).toBeInTheDocument()
    expect(screen.getByText('ALL DISPATCHES')).toBeInTheDocument()
  })

  it('filters news when clicking a desk category tab', () => {
    render(<DashboardNewsWidget />)

    // Click on SYNAPTIC DOCTRINE desk filter tab if available
    const doctrineTab = screen.getByRole('button', { name: /SYNAPTIC DOCTRINE/i })
    fireEvent.click(doctrineTab)

    expect(doctrineTab).toHaveClass('bg-[#00ffff]')
  })

  it('opens in-HUD dispatch article modal reader when clicking a featured post card', () => {
    render(<DashboardNewsWidget />)

    const featuredBadge = screen.getByText('FEATURED DISPATCH')
    expect(featuredBadge).toBeInTheDocument()

    // Click the featured post card
    fireEvent.click(featuredBadge.closest('.cursor-pointer')!)

    // Modal reader should be visible with CLOSE button
    const closeBtn = screen.getByTitle('Close Modal')
    expect(closeBtn).toBeInTheDocument()

    // Close the modal
    fireEvent.click(closeBtn)
    expect(screen.queryByTitle('Close Modal')).not.toBeInTheDocument()
  })

  it('navigates to news desk when clicking OPEN NEWS DESK button', () => {
    render(<DashboardNewsWidget />)

    const openDeskBtn = screen.getByText('OPEN NEWS DESK')
    fireEvent.click(openDeskBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/news' })
  })
})
