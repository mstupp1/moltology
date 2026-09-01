import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageLightbox, ZoomableImage, type LightboxImageItem } from './ImageLightbox'

describe('ImageLightbox Component', () => {
  const mockOnClose = vi.fn()
  const mockOnNavigate = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    src: '/images/marketing/dashboard_feature_preview.webp',
    alt: 'ADVANCED BENTHIC HUD Screenshot',
    title: 'ADVANCED BENTHIC HUD',
    subtitle: 'CORE COMMAND ARCHITECTURE',
    description: 'A centralized command dashboard featuring daily habit routines.',
    specs: ['Daily Habit Tracker', 'Deep-Trench Focus Dome'],
    actionRoute: '/dashboard',
    actionText: 'EXPLORE HUD CONSOLE',
    onNavigate: mockOnNavigate,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnNavigate.mockClear()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ImageLightbox {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('ADVANCED BENTHIC HUD')).not.toBeInTheDocument()
    expect(container.firstChild).toBeNull()
  })

  it('renders high-res preview, title, subtitle, description, specs, and action CTA when isOpen is true', () => {
    render(<ImageLightbox {...defaultProps} />)

    expect(screen.getByText('ADVANCED BENTHIC HUD')).toBeInTheDocument()
    expect(screen.getByText('CORE COMMAND ARCHITECTURE')).toBeInTheDocument()
    expect(screen.getByText('A centralized command dashboard featuring daily habit routines.')).toBeInTheDocument()
    expect(screen.getByText('Daily Habit Tracker')).toBeInTheDocument()
    expect(screen.getByText('Deep-Trench Focus Dome')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /EXPLORE HUD CONSOLE/i })).toBeInTheDocument()

    const img = screen.getByAltText('ADVANCED BENTHIC HUD Screenshot')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('/images/marketing/dashboard_feature_preview.webp')
  })

  it('calls onClose when close button is clicked', () => {
    render(<ImageLightbox {...defaultProps} />)

    const closeBtn = screen.getByRole('button', { name: /Close image preview/i })
    fireEvent.click(closeBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<ImageLightbox {...defaultProps} />)

    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    render(<ImageLightbox {...defaultProps} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('navigates through multi-image gallery with Next/Prev buttons and Arrow keys', () => {
    const images: LightboxImageItem[] = [
      {
        src: '/images/1.webp',
        title: 'Feature One',
        description: 'First feature desc',
      },
      {
        src: '/images/2.webp',
        title: 'Feature Two',
        description: 'Second feature desc',
      },
      {
        src: '/images/3.webp',
        title: 'Feature Three',
        description: 'Third feature desc',
      },
    ]

    render(
      <ImageLightbox
        isOpen={true}
        onClose={mockOnClose}
        images={images}
        currentIndex={0}
      />
    )

    expect(screen.getByText('Feature One')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /Next image/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText('Feature Two')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()

    // Arrow Right key
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Feature Three')).toBeInTheDocument()
    expect(screen.getByText('3 / 3')).toBeInTheDocument()

    // Arrow Left key
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('Feature Two')).toBeInTheDocument()

    // Click Prev
    const prevBtn = screen.getByRole('button', { name: /Previous image/i })
    fireEvent.click(prevBtn)
    expect(screen.getByText('Feature One')).toBeInTheDocument()
  })

  it('handles action CTA click with onNavigate callback', () => {
    render(<ImageLightbox {...defaultProps} />)

    const ctaBtn = screen.getByRole('button', { name: /EXPLORE HUD CONSOLE/i })
    fireEvent.click(ctaBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnNavigate).toHaveBeenCalledWith('/dashboard')
  })
})

describe('ZoomableImage Component', () => {
  it('renders image thumbnail and opens lightbox when clicked', () => {
    render(
      <ZoomableImage
        src="/images/thumb.webp"
        zoomSrc="/images/highres.webp"
        alt="Thumb Alt"
        zoomTitle="Enlarged Preview"
      />
    )

    const trigger = screen.getByRole('button', { name: /Enlarge Enlarged Preview/i })
    expect(trigger).toBeInTheDocument()

    // Modal initially closed
    expect(screen.queryByText('Enlarged Preview')).not.toBeInTheDocument()

    // Click trigger to open modal
    fireEvent.click(trigger)
    expect(screen.getByText('Enlarged Preview')).toBeInTheDocument()
  })
})
