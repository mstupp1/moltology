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

  it('renders the hero with a contact call to action and no donation section', () => {
    renderOrgPage()

    expect(screen.getAllByText('MOLTOLOGY.ORG FOUNDATION').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('MOLTOLOGY FOUNDATION · EST. 2022')).toBeInTheDocument()
    expect(screen.getByText('SAY HELLO').closest('a')).toHaveAttribute('href', '#contact')
    expect(screen.getByText('-8,450m')).toBeInTheDocument()
    expect(screen.queryByText(/SUPPORT ASCENSION FUND/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/TITHING/i)).not.toBeInTheDocument()
    expect(document.getElementById('donations')).toBeNull()
  })

  it('allows switching between About tabs in Overview mode', () => {
    renderOrgPage()

    expect(screen.getByText("WHAT WE'RE HERE TO DO")).toBeInTheDocument()
    expect(screen.getByText('HELP PEOPLE SHED WHAT SLOWS THEM DOWN')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /THE ROADMAP/i }))
    expect(screen.getByText('THE CARCINIZATION ROADMAP')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /SAFETY FIRST/i }))
    expect(screen.getByText(/SAFETY AND POSITIVITY, ALWAYS/i)).toBeInTheDocument()
  })

  it('allows selecting lair chambers in the tour', () => {
    renderOrgPage()

    expect(screen.getByText('OUR UNDERGROUND LAIR: TRENCH LEVEL 7')).toBeInTheDocument()
    expect(screen.getByText(/CHAMBER 01: THE VENT POWER PLANT/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /CHAMBER 02/i }))
    expect(screen.getByText(/CHAMBER 02: THE COUNCIL ROOM/i)).toBeInTheDocument()
  })

  it('renders history and leadership', () => {
    renderOrgPage()

    expect(screen.getByText('HOW WE GOT HERE')).toBeInTheDocument()
    expect(screen.getByText('THE MARIANA SIGNAL')).toBeInTheDocument()
    expect(screen.getByText('Dr. Thaddeus Crust')).toBeInTheDocument()
    expect(screen.getByText('Head of Member Care')).toBeInTheDocument()
  })

  it('switches to Careers and shows open roles and the campus gallery', () => {
    renderOrgPage()

    fireEvent.click(screen.getByRole('button', { name: /^CAREERS$/i }))

    expect(screen.getByText(/BUILD YOUR FUTURE IN/i)).toBeInTheDocument()
    expect(screen.getByText('Senior Bio-Silicon Systems Engineer')).toBeInTheDocument()
    expect(screen.getByText('A DAY AT TRENCH LEVEL 7')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^PLANNING$/i }))
    expect(screen.getAllByText('Conference Room Delta').length).toBeGreaterThanOrEqual(1)
  })

  it('validates the contact form inline and waits for the bot check before sending', async () => {
    const { submitContactFormFn } = await import('@/lib/server/api')
    renderOrgPage()

    expect(screen.getByText('GET IN TOUCH')).toBeInTheDocument()
    const sendBtn = screen.getByRole('button', { name: /SEND MESSAGE/i })

    fireEvent.click(sendBtn)
    expect(screen.getByRole('alert')).toHaveTextContent('Add your name.')

    fireEvent.change(screen.getByLabelText('NAME'), { target: { value: 'Tester Crab' } })
    fireEvent.change(screen.getByLabelText('EMAIL'), { target: { value: 'crab@example.com' } })
    fireEvent.change(screen.getByLabelText('MESSAGE'), { target: { value: 'Requesting a tour of Chamber 04.' } })
    fireEvent.click(sendBtn)

    // The bot check has not finished in the test DOM, so nothing is sent yet.
    expect(screen.getByText(/wait for the security check to finish/i)).toBeInTheDocument()
    expect(submitContactFormFn).not.toHaveBeenCalled()
  })
})
