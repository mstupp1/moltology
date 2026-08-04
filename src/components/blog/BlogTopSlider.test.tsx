import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BlogTopSlider } from './BlogTopSlider'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'

describe('BlogTopSlider', () => {
  it('renders the first featured post by default', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    expect(screen.getByText(/LEAD NEWS DISPATCH \/\/ BREAKING COVERAGE #01/)).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'From Prompt Engineering to Bio-Silicon Cognition: Why AI Courses are Stage 1 of Carcinization'
      )[0]
    ).toBeInTheDocument()
    expect(screen.getByText('High Ascendant Carcinus')).toBeInTheDocument()
  })

  it('navigates to next slide when next button is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const nextBtn = screen.getByLabelText('Next slide')
    fireEvent.click(nextBtn)

    expect(screen.getByText(/LEAD NEWS DISPATCH \/\/ BREAKING COVERAGE #02/)).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'Test-Time Compute & Autonomous Swarm Orchestration: Benthic Protocol 2026'
      )[0]
    ).toBeInTheDocument()
  })

  it('navigates to previous slide when prev button is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const prevBtn = screen.getByLabelText('Previous slide')
    fireEvent.click(prevBtn)

    // Last post index
    expect(
      screen.getAllByText(
        'Sub-Benthic Neural Telemetry: Monitoring Agentic Drift in Recursive Systems'
      )[0]
    ).toBeInTheDocument()
  })

  it('triggers onSelectPost when CTA button or title is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const openBtn = screen.getByText('READ DISPATCH')
    fireEvent.click(openBtn)

    expect(handleSelect).toHaveBeenCalledWith(INITIAL_BLOG_POSTS[0].slug)
  })

  it('jumps directly to selected slide when thumbnail is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const thirdPostThumb = screen.getAllByText(
      'Carcinization Protocol 04: Exoshell Hardening & Zero-Latency RLS Data Isolation'
    )[0]
    fireEvent.click(thirdPostThumb)

    expect(screen.getByText(/LEAD NEWS DISPATCH \/\/ BREAKING COVERAGE #03/)).toBeInTheDocument()
  })
})
