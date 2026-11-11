import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./LobsterAvatarFullBody', () => ({ LobsterAvatarFullBody: ({ alt }: { alt: string }) => <div data-testid="full-body">{alt}</div> }))

import { CharacterOverlay } from './CharacterOverlay'

const config = { seed: 'overlay-test' } as never

describe('CharacterOverlay', () => {
  it('shows the full character in a dialog and closes on Escape, the button or a tap outside', async () => {
    const onClose = vi.fn()
    render(<CharacterOverlay isOpen onClose={onClose} config={config} name="Horatio" />)
    await act(async () => new Promise((r) => setTimeout(r, 0)))
    expect(screen.getByRole('dialog', { name: "Horatio's character" })).toBeTruthy()
    expect(screen.getByTestId('full-body').textContent).toBe("Horatio's character")
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByTestId('character-overlay'))
    expect(onClose).toHaveBeenCalledTimes(3)
    // A tap on the character itself does not close it.
    fireEvent.click(screen.getByTestId('full-body'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('renders nothing while closed', () => {
    render(<CharacterOverlay isOpen={false} onClose={() => {}} config={config} name="Horatio" />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
