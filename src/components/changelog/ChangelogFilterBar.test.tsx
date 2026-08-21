import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChangelogFilterBar } from './ChangelogFilterBar'

describe('ChangelogFilterBar Component', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedCategory: 'ALL',
    onCategoryChange: vi.fn(),
    selectedTag: null,
    onTagChange: vi.fn(),
    categories: [
      { label: 'ALL', count: 14 },
      { label: 'Feature', count: 8 },
      { label: 'Improvement', count: 4 },
      { label: 'Security', count: 2 },
    ],
    tags: [
      { label: 'UI/UX', count: 10 },
      { label: 'Navigation', count: 4 },
      { label: 'AI', count: 3 },
    ],
    totalCount: 14,
    filteredCount: 14,
    onReset: vi.fn(),
  }

  it('renders all categories with counts', () => {
    render(<ChangelogFilterBar {...defaultProps} />)
    expect(screen.getByText('ALL UPDATES')).toBeDefined()
    expect(screen.getByText('Feature')).toBeDefined()
    expect(screen.getByText('Improvement')).toBeDefined()
    expect(screen.getByText('Security')).toBeDefined()
  })

  it('renders tags with hashtag prefixes and counts', () => {
    render(<ChangelogFilterBar {...defaultProps} />)
    expect(screen.getByText('#UI/UX')).toBeDefined()
    expect(screen.getByText('#Navigation')).toBeDefined()
    expect(screen.getByText('#AI')).toBeDefined()
  })

  it('triggers onSearchChange when typing into the input', () => {
    const onSearchChange = vi.fn()
    render(<ChangelogFilterBar {...defaultProps} onSearchChange={onSearchChange} />)
    const input = screen.getByLabelText('Search changelogs')
    fireEvent.change(input, { target: { value: 'Navigation' } })
    expect(onSearchChange).toHaveBeenCalledWith('Navigation')
  })

  it('triggers onCategoryChange when clicking a category tab', () => {
    const onCategoryChange = vi.fn()
    render(<ChangelogFilterBar {...defaultProps} onCategoryChange={onCategoryChange} />)
    const featureButton = screen.getByText('Feature')
    fireEvent.click(featureButton)
    expect(onCategoryChange).toHaveBeenCalledWith('Feature')
  })

  it('triggers onTagChange when clicking a tag button', () => {
    const onTagChange = vi.fn()
    render(<ChangelogFilterBar {...defaultProps} onTagChange={onTagChange} />)
    const tagButton = screen.getByText('#UI/UX')
    fireEvent.click(tagButton)
    expect(onTagChange).toHaveBeenCalledWith('UI/UX')
  })

  it('renders reset button when active filters exist and triggers onReset', () => {
    const onReset = vi.fn()
    render(
      <ChangelogFilterBar
        {...defaultProps}
        selectedCategory="Feature"
        filteredCount={8}
        onReset={onReset}
      />
    )
    const resetButton = screen.getByTitle('Reset all filters')
    expect(resetButton).toBeDefined()
    fireEvent.click(resetButton)
    expect(onReset).toHaveBeenCalled()
  })
})
