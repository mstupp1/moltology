import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeaderBrand } from './HeaderBrand'

describe('HeaderBrand Component', () => {
  it('renders title and subtext correctly', () => {
    render(<HeaderBrand subtext="MOLTOLOGY.ORG FOUNDATION" />)

    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(screen.getByAltText('Order Emblem')).toBeInTheDocument()
  })

  it('hides text when isCollapsed is true', () => {
    render(<HeaderBrand isCollapsed={true} subtext="BENTHIC TEMPLE HUD" />)

    expect(screen.getByAltText('Order Emblem')).toBeInTheDocument()
    expect(screen.queryByText('THE SYNAPTIC PATH')).not.toBeInTheDocument()
    expect(screen.queryByText('BENTHIC TEMPLE HUD')).not.toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<HeaderBrand onClick={handleClick} />)

    fireEvent.click(screen.getByAltText('Order Emblem'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
