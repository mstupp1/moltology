import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HudPagination } from './HudPagination'

describe('HudPagination Component', () => {
  it('renders count summary correctly', () => {
    render(
      <HudPagination
        currentPage={1}
        totalItems={45}
        pageSize={20}
        onPageChange={vi.fn()}
        itemName="releases"
      />
    )
    expect(screen.getByText(/Showing/i)).toBeDefined()
    expect(screen.getByText('45')).toBeDefined()
  })

  it('calculates total pages and renders page buttons', () => {
    render(
      <HudPagination
        currentPage={1}
        totalItems={45}
        pageSize={20}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Page 1')).toBeDefined()
    expect(screen.getByLabelText('Page 2')).toBeDefined()
    expect(screen.getByLabelText('Page 3')).toBeDefined()
  })

  it('calls onPageChange when clicking next and specific page', () => {
    const onPageChange = vi.fn()
    render(
      <HudPagination
        currentPage={1}
        totalItems={60}
        pageSize={20}
        onPageChange={onPageChange}
      />
    )
    const page2Button = screen.getByLabelText('Page 2')
    fireEvent.click(page2Button)
    expect(onPageChange).toHaveBeenCalledWith(2)

    const nextButton = screen.getByLabelText('Go to next page')
    fireEvent.click(nextButton)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables previous and first buttons on page 1', () => {
    render(
      <HudPagination
        currentPage={1}
        totalItems={60}
        pageSize={20}
        onPageChange={vi.fn()}
      />
    )
    const prevButton = screen.getByLabelText('Go to previous page') as HTMLButtonElement
    const firstButton = screen.getByLabelText('Go to first page') as HTMLButtonElement
    expect(prevButton.disabled).toBe(true)
    expect(firstButton.disabled).toBe(true)
  })

  it('disables next and last buttons on the final page', () => {
    render(
      <HudPagination
        currentPage={3}
        totalItems={60}
        pageSize={20}
        onPageChange={vi.fn()}
      />
    )
    const nextButton = screen.getByLabelText('Go to next page') as HTMLButtonElement
    const lastButton = screen.getByLabelText('Go to last page') as HTMLButtonElement
    expect(nextButton.disabled).toBe(true)
    expect(lastButton.disabled).toBe(true)
  })

  it('does not render page buttons if totalItems <= pageSize', () => {
    render(
      <HudPagination
        currentPage={1}
        totalItems={14}
        pageSize={20}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.queryByLabelText('Go to next page')).toBeNull()
    expect(screen.getByText(/Showing/i)).toBeDefined()
  })
})
