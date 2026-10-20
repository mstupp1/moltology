import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrgPage } from './OrgPage'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  createFileRoute: () => (config: any) => config,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

vi.mock('@/lib/server/api', () => ({
  submitContactFormFn: vi.fn(),
}))

describe('OrgPage (Moltology Organization Page)', () => {
  const renderOrgPage = () => {
    return render(
      <ToastProvider>
        <OrgPage />
      </ToastProvider>
    )
  }

  it('renders on the dark theme with the standard logo and no donation section', () => {
    const { container } = renderOrgPage()

    expect(screen.getByRole('heading', { level: 1, name: 'The people behind Moltology' })).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('bg-abyss')
    expect(container.innerHTML).not.toMatch(/bg-white\b(?!\/)|text-slate-|bg-sky-|border-sky-/)
    expect(screen.queryByText(/MOLTOLOGY\.ORG FOUNDATION/i)).not.toBeInTheDocument()
    expect(screen.getAllByText('Moltology').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/SUPPORT ASCENSION FUND/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/TITHING/i)).not.toBeInTheDocument()
    expect(document.getElementById('donations')).toBeNull()
  })

  it('shows values, team, places and history', () => {
    renderOrgPage()

    expect(screen.getByText('People first')).toBeInTheDocument()
    expect(screen.getByText('Dr. Thaddeus Crust')).toBeInTheDocument()
    expect(screen.getByText('Head of Member Care')).toBeInTheDocument()
    expect(screen.getByText('How we got here')).toBeInTheDocument()
    expect(screen.getByText('We heard a signal')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Meeting room' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Meeting room' })).toBeInTheDocument()
  })

  it('switches to Careers and applying fills the contact form', () => {
    renderOrgPage()

    fireEvent.click(screen.getByRole('button', { name: /^Careers$/i }))
    expect(screen.getByText('Work with us')).toBeInTheDocument()
    expect(screen.getByText('Platform engineer')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Apply for Platform engineer' }))
    expect(screen.getByLabelText('Topic')).toHaveValue('careers')
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toContain('Platform engineer')
  })

  it('validates the contact form inline and waits for the bot check before sending', async () => {
    const { submitContactFormFn } = await import('@/lib/server/api')
    renderOrgPage()

    expect(screen.getByText('Get in touch')).toBeInTheDocument()
    const sendBtn = screen.getByRole('button', { name: /Send message/i })

    fireEvent.click(sendBtn)
    expect(screen.getByRole('alert')).toHaveTextContent('Add your name.')

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Tester Crab' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'crab@example.com' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Requesting a tour of the spa.' } })
    fireEvent.click(sendBtn)

    // The bot check has not finished in the test DOM, so nothing is sent yet.
    expect(screen.getByText(/wait for the security check to finish/i)).toBeInTheDocument()
    expect(submitContactFormFn).not.toHaveBeenCalled()
  })
})
