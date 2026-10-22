import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OracleModeMenu } from './OracleHeaderControls'

const openMenu = () => {
  const trigger = screen.getByRole('button', { name: /Display mode/i })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  return trigger
}

describe('OracleModeMenu', () => {
  it('names the current mode on the trigger', () => {
    render(<OracleModeMenu mode="sidebar" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Display mode: Sidebar' })).toBeInTheDocument()
  })

  it('lists sidebar, floating and fullscreen with the current one checked', async () => {
    render(<OracleModeMenu mode="popout" onSelect={vi.fn()} />)
    openMenu()

    const items = await screen.findAllByRole('menuitemradio')
    expect(items.map((item) => item.textContent)).toEqual(['Sidebar', 'Floating', 'Fullscreen'])
    expect(screen.getByRole('menuitemradio', { name: 'Floating' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Sidebar' })).toHaveAttribute('aria-checked', 'false')
  })

  it('switches to the picked mode', async () => {
    const onSelect = vi.fn()
    render(<OracleModeMenu mode="popout" onSelect={onSelect} />)

    openMenu()
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Fullscreen' }))
    expect(onSelect).toHaveBeenCalledWith('page')
  })

  it('does nothing when the current mode is picked again', async () => {
    const onSelect = vi.fn()
    render(<OracleModeMenu mode="popout" onSelect={onSelect} />)

    openMenu()
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Floating' }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
