import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PublicHeader } from './PublicHeader'
import { authClient } from '@/lib/auth-client'
import { getUserProfileFn } from '@/lib/server/api'

// The small avatar's 3D face is covered by its own tests; here it stays on the 2D picture.
vi.mock('@/hooks/usePortrait3D', () => ({ usePortrait3D: () => null }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/server/api', () => ({ getUserProfileFn: vi.fn().mockResolvedValue({ role: 'admin', experiments: ['new-store'] }) }))

let mockPathname = '/'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: mockPathname }),
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
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
    expect(within(nav).getByRole('link', { name: /^QUIZ$/i })).toHaveAttribute('href', '/moltmax')
    expect(within(nav).getByText('About')).toBeInTheDocument()
    // The company page lives in the footer, not the header.
    expect(within(nav).queryByText('Organization')).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /COMPANY/i })).not.toBeInTheDocument()

    const storeLink = within(nav).getByRole('link', { name: /STORE/i })
    expect(storeLink).toBeInTheDocument()
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
    expect(storeLink).toHaveAttribute('target', '_blank')

    // Confirm that SCAN and NEW badges are not rendered in navigation
    expect(screen.queryByText('SCAN')).not.toBeInTheDocument()
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })

  it('points STORE at the on-site catalog for opted-in admins', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', email: 'ops@example.com', role: 'admin' } },
      isPending: false,
    } as never)
    render(<PublicHeader activePage="home" />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const storeLink = within(nav).getByRole('link', { name: /STORE/i })
    await vi.waitFor(() => expect(storeLink).toHaveAttribute('href', '/store'))
    expect(storeLink).not.toHaveAttribute('target')
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never)
  })

  it('keeps Etsy for admins with the store experiment off', async () => {
    vi.mocked(getUserProfileFn).mockResolvedValueOnce({ role: 'admin', experiments: [] } as never)
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-off', role: 'admin' } }, isPending: false,
    } as never)
    render(<PublicHeader activePage="home" />)
    await vi.waitFor(() => expect(getUserProfileFn).toHaveBeenCalled())
    expect(within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', { name: /STORE/i })).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never)
  })

  it('highlights correct navigation links based on activePage or current route', () => {
    mockPathname = '/'
    const { rerender } = render(<PublicHeader activePage="home" />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const homeBtn = within(nav).getByRole('link', { name: /^HOME$/i })
    expect(homeBtn).toHaveClass('text-ink', 'bg-surface-3', 'shadow-nav-current')
    expect(within(homeBtn).queryByTestId('public-header-current-mark')).not.toBeInTheDocument()

    mockPathname = '/news'
    rerender(<PublicHeader activePage="news" />)
    const newsBtn = within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', { name: /NEWS/i })
    expect(newsBtn).toHaveClass('text-ink', 'bg-surface-3')

    mockPathname = '/what-is-moltology'
    rerender(<PublicHeader activePage="about" />)
    const aboutBtn = within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', { name: /^ABOUT$/i })
    expect(aboutBtn).toHaveClass('text-ink', 'bg-surface-3', 'shadow-nav-current')
  })

  it('automatically highlights NEWS tab for any /news sub-page article route', () => {
    mockPathname = '/news/some-article'
    render(<PublicHeader />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const blogBtn = within(nav).getByRole('link', { name: /NEWS/i })
    expect(blogBtn).toHaveClass('text-ink', 'bg-surface-3')
  })

  it('highlights ABOUT for the what-is-moltology hub and subroutes', () => {
    mockPathname = '/what-is-moltology'
    const { rerender } = render(<PublicHeader />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(within(nav).getByRole('link', { name: /^ABOUT$/i })).toHaveClass('text-ink', 'bg-surface-3')

    mockPathname = '/what-is-moltology/beliefs'
    rerender(<PublicHeader />)
    expect(
      within(screen.getByRole('navigation', { name: /main navigation/i })).getByRole('link', {
        name: /^ABOUT$/i,
      }),
    ).toHaveClass('text-ink', 'bg-surface-3')
  })

  it('triggers authentication modal callback when clicking desktop Log in', async () => {
    const onOpenAuth = vi.fn()
    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const loginBtn = (await screen.findAllByRole('button', { name: /LOG IN/i }))[0]
    fireEvent.click(loginBtn)
    expect(onOpenAuth).toHaveBeenCalledWith('login')
  })

  it('gives members the app account panel from their portrait', async () => {
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

    const avatarBtns = await screen.findAllByRole('button', { name: /user account menu, level/i })
    // Phone bar and desktop header both use the app's own XP-ring account control.
    expect(avatarBtns).toHaveLength(2)
    fireEvent.click(avatarBtns[0])
    expect(await screen.findByRole('dialog', { name: /account and today's tasks/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dashboard$/i })).toBeInTheDocument()
  })

  it('ends the phone menu with an Open dashboard row for members', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-2', name: 'Operative Neo', email: 'neo@moltology.org', image: null } },
    } as any)

    render(<PublicHeader activePage="home" />)

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const menu = screen.getByRole('dialog', { name: /^menu$/i })
    expect(await within(menu).findByRole('button', { name: /open dashboard/i })).toBeInTheDocument()
    expect(within(menu).queryByText('neo@moltology.org')).not.toBeInTheDocument()
  })

  it('opens the full-screen phone menu with nav rows and guest actions', async () => {
    const onOpenAuth = vi.fn()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    mockPathname = '/'

    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog', { name: /^menu$/i })).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')

    const menu = screen.getByRole('dialog', { name: /^menu$/i })
    const mobileNav = within(menu).getByRole('navigation', { name: /mobile navigation/i })
    expect(within(mobileNav).getByRole('link', { name: /^Quiz/i })).toHaveTextContent('Quiz')
    expect(within(mobileNav).getByRole('link', { name: /^Home/i })).toHaveAttribute('aria-current', 'page')
    expect(within(menu).getByRole('button', { name: /close menu/i })).toBeInTheDocument()

    fireEvent.click(await within(menu).findByRole('button', { name: /^log in$/i }))
    expect(onOpenAuth).toHaveBeenCalledWith('login')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('puts a Join button in the phone pill for guests', async () => {
    const onOpenAuth = vi.fn()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const joinButtons = await screen.findAllByRole('button', { name: /^join$/i })
    fireEvent.click(joinButtons[0])
    expect(onOpenAuth).toHaveBeenCalledWith('signup')
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
    expect(screen.getAllByRole('button', { name: /^join$/i })).toHaveLength(2)
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
    expect(newsLink).toHaveClass('text-ink', 'bg-surface-3')
    expect(forumLink).toHaveClass('text-ink')
    expect(forumLink).not.toHaveClass('text-ink-muted', 'bg-surface-3')

    fireEvent.focus(within(nav).getByRole('link', { name: /^QUIZ$/i }))
    expect(newsLink).toHaveClass('text-ink', 'bg-surface-3')
  })

  it('closes the mobile menu with Escape', () => {
    render(<PublicHeader activePage="home" />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })
})
