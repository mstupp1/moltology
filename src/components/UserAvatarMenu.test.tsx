import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserAvatarMenu } from './UserAvatarMenu'
import { authClient } from '@/lib/auth-client'
import { isSignOutInFlight } from '@/lib/auth-session'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/server/api', () => ({
  getUserProfileFn: vi.fn().mockResolvedValue({ emailOptIn: false }),
}))

describe('UserAvatarMenu Component', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Carcinus Ascendant',
    email: 'carcinus@moltology.org',
    image: 'https://lh3.googleusercontent.com/avatar.jpg',
  }

  beforeEach(() => {
    vi.mocked(authClient.signOut).mockClear()
    vi.mocked(authClient.signOut).mockResolvedValue({} as never)
  })

  it('renders avatar button without menu open initially', () => {
    render(<UserAvatarMenu user={mockUser} />)

    const btn = screen.getByRole('button', { name: /user account menu/i })
    expect(btn).toBeInTheDocument()
    expect(screen.queryByText('Carcinus Ascendant')).not.toBeInTheDocument()
  })

  it('opens dropdown menu when avatar button is clicked and displays user details, SETTINGS, and SIGN OUT button', () => {
    render(<UserAvatarMenu user={mockUser} />)

    const btn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(btn)

    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()
    expect(screen.getByText('carcinus@moltology.org')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^settings$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign out$/i })).toBeInTheDocument()
    expect(screen.getByText('SIGN OUT')).toBeInTheDocument()
    expect(screen.getByText('SETTINGS')).toBeInTheDocument()
  })

  it('triggers authClient.signOut when clicking SIGN OUT button inside dropdown menu', async () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    const signOutBtn = screen.getByRole('button', { name: /^sign out$/i })
    fireEvent.click(signOutBtn)

    expect(authClient.signOut).toHaveBeenCalled()
    expect(isSignOutInFlight()).toBe(true)
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('does not collapse the menu on mousedown outside, so Sign Out can still fire', async () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    const signOutBtn = screen.getByRole('button', { name: /^sign out$/i })
    expect(screen.getByRole('button', { name: /user account menu/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    fireEvent.mouseDown(document.body)
    expect(screen.getByRole('button', { name: /user account menu/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(signOutBtn).toBeInTheDocument()

    fireEvent.click(signOutBtn)
    expect(authClient.signOut).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('starts sign-out on pointerdown so a later dismiss cannot swallow the action', async () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    const signOutBtn = screen.getByRole('button', { name: /^sign out$/i })

    fireEvent.pointerDown(signOutBtn)
    expect(authClient.signOut).toHaveBeenCalledTimes(1)
    expect(isSignOutInFlight()).toBe(true)

    fireEvent.mouseDown(document.body)
    fireEvent.click(signOutBtn)
    expect(authClient.signOut).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('signs out from the inline mobile accordion on one Sign Out activation', async () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} inline />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    fireEvent.pointerDown(screen.getByRole('button', { name: /^sign out$/i }))

    expect(authClient.signOut).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('closes the menu on click outside', async () => {
    render(<UserAvatarMenu user={mockUser} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.click(document.body)
    await waitFor(() => {
      expect(screen.queryByText('Carcinus Ascendant')).not.toBeInTheDocument()
    })
  })

  it('releases the latch and stays aboard when sign-out fails', async () => {
    vi.mocked(authClient.signOut).mockRejectedValueOnce(new Error('hatch jammed'))
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /^sign out$/i }))

    await waitFor(() => {
      expect(isSignOutInFlight()).toBe(false)
    })
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('closes dropdown menu when pressing Escape', async () => {
    render(<UserAvatarMenu user={mockUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)
    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByText('Carcinus Ascendant')).not.toBeInTheDocument()
    })
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

  it('renders SUPER ADMIN badge when user email is myles@moltology.org', () => {
    const superAdminUser = {
      ...mockUser,
      email: 'myles@moltology.org',
    }
    render(<UserAvatarMenu user={superAdminUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByText('SUPER ADMIN')).toBeInTheDocument()
  })

  it('renders Underwater Bubbles toggle switch inside dropdown menu and toggles state', () => {
    localStorage.clear()
    render(<UserAvatarMenu user={mockUser} />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getByText('Underwater Bubbles')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    const toggleBtn = screen.getByRole('switch', { name: /underwater bubbles toggle/i })
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggleBtn)

    expect(toggleBtn).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Off')).toBeInTheDocument()
    expect(localStorage.getItem('moltology_heavy_vfx_disabled')).toBe('true')
  })

  it('renders inline mobile mode and smoothly expands on click', async () => {
    render(<UserAvatarMenu user={mockUser} inline={true} />)

    const triggerBtn = screen.getByRole('button', { name: /user account menu/i })
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()

    // Sign out button is hidden before expanding
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()

    // Click trigger to expand
    fireEvent.click(triggerBtn)
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByText('Underwater Bubbles')).toBeInTheDocument()

    // Click trigger again to collapse
    fireEvent.click(triggerBtn)
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
    })
  })

  it('renders corporate light mode styling on desktop when variant="corporate"', () => {
    const { container } = render(<UserAvatarMenu user={mockUser} variant="corporate" />)

    const triggerBtn = screen.getByRole('button', { name: /user account menu/i })
    expect(triggerBtn.className).toContain('bg-white')
    expect(triggerBtn.className).toContain('border-sky-200')

    fireEvent.click(triggerBtn)

    const dropdown = container.querySelector('.bg-white\\/95')
    expect(dropdown).toBeInTheDocument()
    expect(screen.getByText('Carcinus Ascendant').className).toContain('text-slate-800')
    expect(screen.getByRole('button', { name: /sign out/i }).className).toContain('text-rose-600')
  })

  it('renders corporate light mode styling on mobile when variant="corporate"', () => {
    render(<UserAvatarMenu user={mockUser} inline={true} variant="corporate" />)

    const triggerBtn = screen.getByRole('button', { name: /user account menu/i })
    expect(triggerBtn.className).toContain('bg-sky-50')
    expect(triggerBtn.className).toContain('text-slate-800')

    fireEvent.click(triggerBtn)

    expect(screen.getByRole('button', { name: /sign out/i }).className).toContain('text-rose-600')
  })

  it('renders Settings link inside dropdown menu', () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    const settingsBtn = screen.getByRole('button', { name: /^settings$/i })
    expect(settingsBtn).toBeInTheDocument()

    fireEvent.click(settingsBtn)
    expect(onNavigate).toHaveBeenCalledWith('/settings')
  })

  it('navigates to the own-profile alias from YOUR PROFILE', () => {
    const onNavigate = vi.fn()
    render(<UserAvatarMenu user={mockUser} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: /user account menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /^your profile$/i }))

    expect(onNavigate).toHaveBeenCalledWith('/profile')
    expect(onNavigate).not.toHaveBeenCalledWith('/member/user-123')
  })
})
