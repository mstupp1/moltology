import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BlogTopSlider } from './BlogTopSlider'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'

describe('BlogTopSlider', () => {
  it('renders the first featured post by default', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    expect(screen.getByText(/LEAD NEWS DISPATCH · BREAKING COVERAGE #01/)).toBeInTheDocument()
    expect(
      screen.getAllByText(
        INITIAL_BLOG_POSTS[0].title
      )[0]
    ).toBeInTheDocument()
    expect(screen.getAllByText(INITIAL_BLOG_POSTS[0].authorName)[0]).toBeInTheDocument()
  })

  it('navigates to next slide when next button is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const nextBtn = screen.getByLabelText('Next slide')
    fireEvent.click(nextBtn)

    expect(screen.getByText(/LEAD NEWS DISPATCH · BREAKING COVERAGE #02/)).toBeInTheDocument()
    expect(
      screen.getAllByText(
        INITIAL_BLOG_POSTS[1].title
      )[0]
    ).toBeInTheDocument()
  })

  it('navigates to previous slide when prev button is clicked', () => {
    const handleSelect = vi.fn()
    render(<BlogTopSlider posts={INITIAL_BLOG_POSTS} onSelectPost={handleSelect} />)

    const prevBtn = screen.getByLabelText('Previous slide')
    fireEvent.click(prevBtn)

    // Last featured post index (slice 0, 5 -> index 4)
    expect(
      screen.getAllByText(
        INITIAL_BLOG_POSTS[4].title
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
      INITIAL_BLOG_POSTS[2].title
    )[0]
    fireEvent.click(thirdPostThumb)

    expect(screen.getByText(/LEAD NEWS DISPATCH · BREAKING COVERAGE #03/)).toBeInTheDocument()
  })
})
