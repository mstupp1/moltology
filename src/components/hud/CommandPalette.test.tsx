import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { searchMembersFn } from '@/lib/server/api'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params }: any) => (
    <a href={typeof to === 'string' ? to : '/member'} data-profile={params?.profileId}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/api', () => ({
  searchMembersFn: vi.fn(),
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="avatar" />,
}))

function signedInSession() {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { id: 'user-1', name: 'Operative' } },
    isPending: false,
  } as any)
}

function guestSession() {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
  } as any)
}

const clawLord = {
  id: 'member-claw',
  larvaId: 'LARVA UNIT #9',
  handle: 'claw_lord',
  displayName: 'claw_lord',
  stage: 2,
  stageLabel: 'Soft-Shed',
  avatarConfig: null,
}

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    guestSession()
    vi.mocked(searchMembersFn).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is initially closed', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('opens on Meta+K or Ctrl+K shortcut', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type a command or search protocol/i)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('opens on custom open-command-palette event', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
  })

  it('closes on Escape key press', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('closes when clicking outside (on the overlay backdrop)', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const overlay = screen.getByTestId('command-palette-overlay')
    expect(overlay).toBeInTheDocument()

    fireEvent.click(overlay)
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('does NOT close when clicking inside the modal content', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const modal = screen.getByTestId('command-palette-modal')
    expect(modal).toBeInTheDocument()

    fireEvent.click(modal)
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)
    fireEvent.click(input)
    expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument()
  })

  it('closes when clicking the close (X) button', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const closeBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(closeBtn)

    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('filters commands when typing in the search input', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)

    fireEvent.change(input, { target: { value: 'Codex' } })
    expect(screen.getByText('Open Sacred Codex & Canonical Scriptures')).toBeInTheDocument()
    expect(screen.queryByText('Open Subterranean Vats & Level -7 Bio-Vault')).not.toBeInTheDocument()
  })

  it('surfaces the shared chamber index for oracle, connections, and news', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)

    fireEvent.change(input, { target: { value: 'oracle' } })
    expect(screen.getByText('Consult the Synaptic Oracle')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'connections' } })
    expect(screen.getByText('Open Connections & Fellow Shells')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'news' } })
    expect(screen.getByText('Open MoltNation News')).toBeInTheDocument()
    expect(screen.getAllByText(/Read Dispatch:/).length).toBeGreaterThan(0)
  })

  it('executes command action and navigates on click', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)

    fireEvent(window, new CustomEvent('open-command-palette'))
    const codexOption = screen.getByText('Open Sacred Codex & Canonical Scriptures')
    fireEvent.click(codexOption)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('lets guests jump pages without leaking people rows', async () => {
    vi.mocked(searchMembersFn).mockResolvedValue([clawLord])
    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)
    fireEvent.change(input, { target: { value: 'Codex' } })

    expect(screen.getByText('Sign in to search fellow members. Page jumps stay open.')).toBeInTheDocument()
    expect(screen.queryByText('claw_lord')).not.toBeInTheDocument()
    expect(searchMembersFn).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Open Sacred Codex & Canonical Scriptures'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
  })

  it('shows signed-in people first and Enter opens that member dossier', async () => {
    signedInSession()
    vi.mocked(searchMembersFn).mockResolvedValue([clawLord])

    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    const input = screen.getByPlaceholderText(/Type a command or search protocol/i)
    fireEvent.change(input, { target: { value: 'claw' } })

    await waitFor(() => {
      expect(screen.getByText('claw_lord')).toBeInTheDocument()
    })
    expect(searchMembersFn).toHaveBeenCalled()

    const modal = screen.getByTestId('command-palette-modal')
    fireEvent.keyDown(modal, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/member/$profileId',
      params: { profileId: 'claw_lord' },
    })
    expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument()
  })

  it('sends See all to /search with people when people were in view', async () => {
    signedInSession()
    vi.mocked(searchMembersFn).mockResolvedValue([clawLord])

    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    fireEvent.change(screen.getByPlaceholderText(/Type a command or search protocol/i), {
      target: { value: 'claw' },
    })
    await waitFor(() => {
      expect(screen.getByText('claw_lord')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('command-palette-see-all'))
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: { q: 'claw', type: 'people' },
    })
  })

  it('sends Enter on a no-match query to /search pages', () => {
    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    fireEvent.change(screen.getByPlaceholderText(/Type a command or search protocol/i), {
      target: { value: 'zzzz-no-chamber' },
    })
    fireEvent.keyDown(screen.getByTestId('command-palette-modal'), { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/search',
      search: { q: 'zzzz-no-chamber', type: 'pages' },
    })
  })

  it('moves the highlight across people and pages with arrow keys', async () => {
    signedInSession()
    vi.mocked(searchMembersFn).mockResolvedValue([clawLord])

    render(<ToastProvider><CommandPalette /></ToastProvider>)
    fireEvent(window, new CustomEvent('open-command-palette'))
    fireEvent.change(screen.getByPlaceholderText(/Type a command or search protocol/i), {
      target: { value: 'cod' },
    })
    await waitFor(() => {
      expect(screen.getByText('claw_lord')).toBeInTheDocument()
    })
    expect(screen.getByText('Open Sacred Codex & Canonical Scriptures')).toBeInTheDocument()

    const modal = screen.getByTestId('command-palette-modal')
    fireEvent.keyDown(modal, { key: 'ArrowDown' })
    fireEvent.keyDown(modal, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
  })
})
