import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Route } from './auth'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()
let mockSearch: { mode?: 'login' | 'signup'; redirect?: string } = { mode: 'login' }

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useSearch: () => mockSearch,
  }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/auth' }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

const AuthRoute = Route.options.component!

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signIn: {
      social: vi.fn(),
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}))

vi.mock('@/lib/server/api', () => ({
  getUserProfileFn: vi.fn().mockResolvedValue({ id: 'user-1' }),
  updateEmailPreferencesFn: vi.fn().mockResolvedValue({ success: true, emailOptIn: true }),
  claimMemberHandleFn: vi.fn().mockResolvedValue({ handle: 'ascendant_unit', displayName: 'ascendant_unit' }),
}))

describe('Auth Split Landing Page Component (/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch = { mode: 'login' }
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('renders shared HeaderBrand and prominent value propositions on left side', () => {
    render(<AuthRoute />)

    // Verify shared HeaderBrand text
    const brandElements = screen.getAllByText('THE SYNAPTIC PATH')
    expect(brandElements.length).toBeGreaterThan(0)
    expect(screen.getAllByText('MOLTOLOGY.ORG FOUNDATION').length).toBeGreaterThan(0)

    // Clicking HeaderBrand navigates to home
    fireEvent.click(brandElements[0])
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })

    // Verify Headline & Value Props
    expect(screen.getByRole('heading', { name: /Enter The Synaptic Path/i })).toBeInTheDocument()
    expect(screen.getByText(/Ecdysis Diagnostics & Tracking/i)).toBeInTheDocument()
    expect(screen.getByText(/Benthic AI Oracle & Swarm Access/i)).toBeInTheDocument()
    expect(screen.getByText(/Chitin Matrix State Persistence/i)).toBeInTheDocument()
    expect(screen.getByText(/14,200\+ Units Synchronized/i)).toBeInTheDocument()

    // Verify Auth Card on right
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument()

    // Verify Back to Home button on right
    const backBtn = screen.getByText('Back to Home')
    fireEvent.click(backBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('switches between Sign Up and Sign In modes when tabs are clicked', () => {
    render(<AuthRoute />)

    // Click Sign Up tab
    const signUpTab = screen.getByRole('tab', { name: /Sign Up/i })
    fireEvent.click(signUpTab)

    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument()
    expect(screen.getByText('Sign up to persist your session')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your_designation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Create Account$/i })).toBeInTheDocument()

    // Click Sign In tab
    const signInTab = screen.getByRole('tab', { name: /Sign In/i })
    fireEvent.click(signInTab)

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('your_designation')).not.toBeInTheDocument()
  })

  it('triggers Google OAuth flow with callback destination', async () => {
    mockSearch = { mode: 'login', redirect: '/chassis' }
    vi.mocked(authClient.signIn.social).mockResolvedValue({} as any)

    render(<AuthRoute />)

    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i })
    fireEvent.click(googleBtn)

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: expect.stringContaining('/chassis'),
    })
  })

  it('caches the member after one successful Google sign-in response', async () => {
    mockSearch = { mode: 'login', redirect: '/dashboard' }
    vi.mocked(authClient.signIn.social).mockResolvedValue({
      data: { user: { id: 'usr_google', name: 'Myles' } },
    } as any)

    render(<AuthRoute />)

    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }))

    const { getCachedUser } = await import('@/lib/auth-session')
    await waitFor(() => {
      expect(authClient.signIn.social).toHaveBeenCalledTimes(1)
      expect(getCachedUser()?.id).toBe('usr_google')
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
    })
  })

  it('submits sign-in form and navigates on success', async () => {
    mockSearch = { mode: 'login', redirect: '/dashboard' }
    vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: { id: 'user-123' } } } as any)

    render(<AuthRoute />)

    const emailInput = screen.getByPlaceholderText('name@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    fireEvent.change(emailInput, { target: { value: 'pilot@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'pilot@example.com',
        password: 'password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
    })
  })

  it('submits sign-up form and navigates on success', async () => {
    mockSearch = { mode: 'signup', redirect: '/moltmax' }
    vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: { id: 'user-456' } } } as any)

    render(<AuthRoute />)

    const nameInput = screen.getByPlaceholderText('your_designation')
    const emailInput = screen.getByPlaceholderText('name@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    fireEvent.change(nameInput, { target: { value: 'ascendant_unit' } })
    fireEvent.change(emailInput, { target: { value: 'unit@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'securepwd123' } })

    const submitBtn = screen.getByRole('button', { name: /^Create Account$/i })
    fireEvent.click(submitBtn)

    const { claimMemberHandleFn } = await import('@/lib/server/api')
    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: 'ascendant_unit',
        email: 'unit@example.com',
        password: 'securepwd123',
      })
      expect(claimMemberHandleFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
          handle: 'ascendant_unit',
          userId: 'user-456',
        }),
      })
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/moltmax' })
    })
  })

  it('rejects a reserved designation on signup instead of creating the account', async () => {
    mockSearch = { mode: 'signup' }
    render(<AuthRoute />)

    fireEvent.change(screen.getByPlaceholderText('your_designation'), { target: { value: 'oracle' } })
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'unit@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'securepwd123' } })
    fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }))

    await waitFor(() => {
      expect(screen.getAllByText(/reserved for the Order/i).length).toBeGreaterThan(0)
    })
    expect(authClient.signUp.email).not.toHaveBeenCalled()
  })

  it('displays error alerts when authentication fails', async () => {
    mockSearch = { mode: 'login' }
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      error: { message: 'Invalid email or password.' },
    } as any)

    render(<AuthRoute />)

    const emailInput = screen.getByPlaceholderText('name@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })
  })

  it('automatically redirects authenticated users to dashboard', () => {
    mockSearch = { mode: 'login', redirect: '/custom-chassis' }
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'existing-user-1',
          name: 'Logged Unit',
        },
      },
    } as any)

    render(<AuthRoute />)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/custom-chassis' })
  })

  it('renders explicit opt-in checkbox below CTA button on signup and syncs preferences when checked', async () => {
    const { updateEmailPreferencesFn } = await import('@/lib/server/api')
    mockSearch = { mode: 'signup' }
    vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: { id: 'user-789' } } } as any)

    render(<AuthRoute />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText(/Keep me updated with Moltology news, articles, and product updates/i)).toBeInTheDocument()
    expect(screen.getByText(/Zero spam. Unsubscribe at any time/i)).toBeInTheDocument()

    // Check opt-in checkbox
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    // Fill in and submit
    fireEvent.change(screen.getByPlaceholderText('your_designation'), { target: { value: 'subscriber_unit' } })
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'sub@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }))

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalled()
      expect(updateEmailPreferencesFn).toHaveBeenCalledWith({
        data: {
          emailOptIn: true,
          source: 'auth_page',
          userId: 'user-789',
        },
      })
    })
  })

  it('marks the gateway noindex and does not emit a public canonical', async () => {
    const headFn = Route.options.head
    if (typeof headFn !== 'function') {
      throw new Error('auth route is missing a head function')
    }
    const head = await headFn({} as never)
    expect(head.meta).toEqual(
      expect.arrayContaining([{ name: 'robots', content: 'noindex, nofollow' }]),
    )
    expect(head.links ?? []).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rel: 'canonical' })]),
    )
    expect(head.meta?.some((entry) => entry && 'property' in entry && entry.property === 'og:url')).toBe(false)
  })

  it('holds the sign-up form while the session is unresolved', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<AuthRoute />)

    expect(screen.getByTestId('auth-session-skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Sign Up/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Create Account/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Welcome Back/i })).not.toBeInTheDocument()
  })

  it('holds the sign-up form for the first-paint empty session shape', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    render(<AuthRoute />)

    expect(screen.getByTestId('auth-session-skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Sign Up/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Welcome Back/i })).not.toBeInTheDocument()
  })
})
