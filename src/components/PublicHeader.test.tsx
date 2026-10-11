import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PublicHeader } from './PublicHeader'
import { authClient } from '@/lib/auth-client'

let mockPathname = '/'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: mockPathname }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}))

describe('PublicHeader Navigation Component', () => {
  it('renders shared brand emblem, title, and route links without SCAN or NEW badges', () => {
    render(<PublicHeader activePage="home" />)

    expect(screen.getByText('Moltology')).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: /^HOME$/i })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /^MOLTMAX$/i })).toBeInTheDocument()
    expect(within(nav).getByText('ABOUT')).toBeInTheDocument()
    expect(within(nav).getByText('ORGANIZATION')).toBeInTheDocument()

    const aboutBtn = within(nav).getByRole('link', { name: /^ABOUT$/i })
    const orgBtn = within(nav).getByRole('link', { name: /ORGANIZATION/i })
    expect(
      aboutBtn.compareDocumentPosition(orgBtn) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    const storeLink = within(nav).getByRole('link', { name: /STORE/i })
    expect(storeLink).toBeInTheDocument()
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
    expect(storeLink).toHaveAttribute('target', '_blank')

    // Confirm that SCAN and NEW badges are not rendered in navigation
    expect(screen.queryByText('SCAN')).not.toBeInTheDocument()
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('points STORE at the on-site catalog for admins', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', email: 'ops@example.com', role: 'admin' } },
      isPending: false,
    } as never)
    render(<PublicHeader activePage="home" />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const storeLink = within(nav).getByRole('link', { name: /STORE/i })
    expect(storeLink).toHaveAttribute('href', '/store')
    expect(storeLink).not.toHaveAttribute('target')
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never)
  })

  it('highlights correct navigation links based on activePage or current route', () => {
    mockPathname = '/'
    const { rerender } = render(<PublicHeader activePage="home" />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const homeBtn = within(nav).getByRole('link', { name: /^HOME$/i })
    expect(homeBtn).toHaveClass('text-ink', 'bg-surface-2')
    expect(within(homeBtn).getByTestId('public-header-current-mark')).toHaveClass('bg-cyan-glow')

    mockPathname = '/news'
    rerender(<PublicHeader activePage="news" />)
    const newsBtn = within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', { name: /NEWS/i })
    expect(newsBtn).toHaveClass('text-ink', 'bg-surface-2')

    mockPathname = '/org'
    rerender(<PublicHeader activePage="org" />)
    const orgBtn = within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', { name: /ORGANIZATION/i })
    expect(orgBtn.className).toContain('text-sky-700')
  })

  it('renders corporate variant with clean light header, sky accents, and JOIN FAMILY CTA', async () => {
    const onOpenAuth = vi.fn()
    const { container } = render(<PublicHeader activePage="org" variant="corporate" onOpenAuth={onOpenAuth} />)

    const header = container.querySelector('header')!
    expect(header.className).toContain('bg-white')

    const joinBtn = await screen.findAllByRole('button', { name: /JOIN FAMILY/i })
    expect(joinBtn.length).toBeGreaterThan(0)
    expect(joinBtn[0].className).toContain('bg-sky-500')

    fireEvent.click(joinBtn[0])
    expect(onOpenAuth).toHaveBeenCalledWith('signup')
  })

  it('automatically highlights NEWS tab for any /news sub-page article route', () => {
    mockPathname = '/news/some-article'
    render(<PublicHeader />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const blogBtn = within(nav).getByRole('link', { name: /NEWS/i })
    expect(blogBtn).toHaveClass('text-ink', 'bg-surface-2')
  })

  it('highlights ABOUT for the what-is-moltology hub and subroutes', () => {
    mockPathname = '/what-is-moltology'
    const { rerender } = render(<PublicHeader />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: /^ABOUT$/i })).toHaveClass('text-ink', 'bg-surface-2')

    mockPathname = '/what-is-moltology/beliefs'
    rerender(<PublicHeader />)
    expect(
      within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', {
        name: /^ABOUT$/i,
      }),
    ).toHaveClass('text-ink', 'bg-surface-2')
  })

  it('triggers authentication modal callback when clicking desktop LOG IN / JOIN PATH', async () => {
    const onOpenAuth = vi.fn()
    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const loginBtn = (await screen.findAllByRole('button', { name: /LOG IN/i }))[0]
    fireEvent.click(loginBtn)
    expect(onOpenAuth).toHaveBeenCalledWith('login')
  })

  it('renders user SSO avatar menu when user is signed in', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Google User',
          email: 'googleuser@gmail.com',
          image: 'https://lh3.googleusercontent.com/sso-avatar.jpg',
        },
      },
    } as any)

    render(<PublicHeader activePage="home" />)

    const avatarBtns = await screen.findAllByRole('button', { name: /user account menu/i })
    expect(avatarBtns.length).toBeGreaterThan(0)

    const avatarBtn = avatarBtns[0]
    fireEvent.click(avatarBtn)

    expect(screen.getAllByText('Google User').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('renders mobile-friendly operative account accordion in hamburger menu when signed in', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-2',
          name: 'Operative Neo',
          email: 'neo@moltology.org',
          image: null,
        },
      },
    } as any)

    render(<PublicHeader activePage="home" />)

    const toggle = screen.getByRole('button', { name: /toggle navigation menu/i })
    fireEvent.click(toggle)

    const avatarBtns = await screen.findAllByRole('button', { name: /user account menu/i })
    const mobileAvatarBtn = avatarBtns[avatarBtns.length - 1]
    expect(mobileAvatarBtn).toBeInTheDocument()

    // Clicking the mobile accordion button opens the account drawer with settings and sign out
    fireEvent.click(mobileAvatarBtn)
    expect(screen.getAllByText('neo@moltology.org').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /^settings$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.queryByText('Underwater Bubbles')).not.toBeInTheDocument()
  })

  it('renders corporate light mode user avatar menu when variant="corporate"', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-3',
          name: 'Corp Exec',
          email: 'exec@moltology.org',
          image: null,
        },
      },
    } as any)

    const { container } = render(<PublicHeader activePage="org" variant="corporate" />)

    const avatarBtns = await screen.findAllByRole('button', { name: /user account menu/i })
    expect(avatarBtns.length).toBeGreaterThan(0)

    const desktopAvatarBtn = avatarBtns[0]
    expect(desktopAvatarBtn.className).toContain('bg-white')
    expect(desktopAvatarBtn.className).toContain('border-sky-200')

    fireEvent.click(desktopAvatarBtn)

    const dropdown = container.querySelector('.bg-white\\/95')
    expect(dropdown).toBeInTheDocument()
    const execNames = screen.getAllByText('Corp Exec')
    expect(execNames.length).toBeGreaterThan(0)
    expect(execNames[0].className).toContain('text-slate-800')
  })

  it('opens mobile menu with nav links and auth actions via hamburger toggle without badges', async () => {
    const onOpenAuth = vi.fn()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const toggle = screen.getByRole('button', { name: /toggle navigation menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    // Mobile links are in the DOM but the dropdown is collapsed (max-h-0)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const moltmaxMobileBtn = screen.getAllByRole('link', { name: /^MOLTMAX$/i })
    expect(moltmaxMobileBtn.length).toBeGreaterThanOrEqual(2) // 1 desktop, 1 mobile

    const mobileLogin = (await screen.findAllByRole('button', { name: /LOG IN/i })).at(-1)!
    fireEvent.click(mobileLogin)
    expect(onOpenAuth).toHaveBeenCalledWith('login')
    // closing menu on auth open
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('hides header when scrolling down past threshold and shows header when scrolling up', () => {
    const { container } = render(<PublicHeader activePage="home" />)
    const headerEl = container.querySelector('header')!

    expect(headerEl.className).toContain('translate-y-0')

    // Simulate scroll down
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true })
    fireEvent.scroll(window)

    expect(headerEl.className).toContain('-translate-y-full')

    // Simulate scroll up
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    fireEvent.scroll(window)

    expect(headerEl.className).toContain('translate-y-0')
  })

  it('renders subtle auth placeholder without flashing guest buttons when session is pending', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    render(<PublicHeader activePage="home" />)

    expect(await screen.findByTestId('public-header-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /LOG IN/i })).not.toBeInTheDocument()
  })

  it('renders guest auth buttons once session settles with no user', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<PublicHeader activePage="home" />)

    expect((await screen.findAllByRole('button', { name: /LOG IN/i })).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /JOIN PATH/i }).length).toBeGreaterThan(0)
    expect(screen.queryByTestId('public-header-auth-skeleton')).not.toBeInTheDocument()
  })

  it('keeps the current page highlighted while the lens previews a hovered tab', () => {
    mockPathname = '/news'
    render(<PublicHeader activePage="news" />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const newsLink = within(nav).getByRole('link', { name: /NEWS/i })
    const forumLink = within(nav).getByRole('link', { name: /^FORUM$/i })

    expect(newsLink).toHaveAttribute('aria-current', 'page')
    expect(newsLink).toHaveAttribute('href', '/news')
    expect(forumLink).not.toHaveAttribute('aria-current')

    fireEvent.mouseEnter(forumLink)
    expect(newsLink).toHaveClass('text-ink', 'bg-surface-2')
    expect(within(newsLink).getByTestId('public-header-current-mark')).toBeInTheDocument()
    expect(forumLink).toHaveClass('text-ink')
    expect(forumLink).not.toHaveClass('text-ink-muted')
    expect(within(forumLink).queryByTestId('public-header-current-mark')).not.toBeInTheDocument()

    fireEvent.focus(within(nav).getByRole('link', { name: /^MOLTMAX$/i }))
    expect(newsLink).toHaveClass('text-ink', 'bg-surface-2')
  })

  it('closes the mobile menu with Escape', () => {
    render(<PublicHeader activePage="home" />)
    const toggle = screen.getByRole('button', { name: /toggle navigation menu/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
