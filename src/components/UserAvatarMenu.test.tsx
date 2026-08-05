import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserAvatarMenu } from './UserAvatarMenu'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue({}),
  },
}))

describe('UserAvatarMenu Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Carcinus Ascendant',
    email: 'carcinus@moltology.org',
    image: 'https://lh3.googleusercontent.com/avatar.jpg',
  }

  it('renders avatar button without menu open initially', () => {
    render(<UserAvatarMenu user={mockUser} />)

    const btn = screen.getByRole('button', { name: /user account menu/i })
    expect(btn).toBeInTheDocument()
    expect(screen.queryByText('Carcinus Ascendant')).not.toBeInTheDocument()
  })

  it('opens dropdown menu when avatar button is clicked and displays user details and SIGN OUT button', () => {
    render(<UserAvatarMenu user={mockUser} />)

    const btn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(btn)

    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()
    expect(screen.getByText('carcinus@moltology.org')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('triggers authClient.signOut when clicking SIGN OUT button inside dropdown menu', async () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    const signOutBtn = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutBtn)

    expect(authClient.signOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('closes dropdown menu when pressing Escape', () => {
    render(<UserAvatarMenu user={mockUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)
    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Carcinus Ascendant')).not.toBeInTheDocument()
  })

  it('renders SUPER ADMIN badge when user email matches super admin email', () => {
    const superAdminUser = {
      ...mockUser,
      email: 'mylesstupp@gmail.com',
    }
    render(<UserAvatarMenu user={superAdminUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByText('SUPER ADMIN')).toBeInTheDocument()
  })

  it('renders Heavy VFX toggle switch inside dropdown menu and toggles state', () => {
    localStorage.clear()
    render(<UserAvatarMenu user={mockUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByText('Disable Heavy VFX')).toBeInTheDocument()
    expect(screen.getByText('VFX Active (Full Graphics)')).toBeInTheDocument()

    const toggleBtn = screen.getByRole('switch', { name: /disable heavy vfx toggle/i })
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(toggleBtn)

    expect(toggleBtn).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('VFX Off (Performance Mode)')).toBeInTheDocument()
    expect(localStorage.getItem('moltology_heavy_vfx_disabled')).toBe('true')
  })
})
