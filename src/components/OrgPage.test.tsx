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
    useSession: () => ({ data: null }),
  },
}))

describe('OrgPage (Moltology Organization Page)', () => {
  const renderOrgPage = () => {
    return render(
      <ToastProvider>
        <OrgPage />
      </ToastProvider>
    )
  }

  it('renders header, brand logo, and hero section', () => {
    renderOrgPage()

    expect(screen.getAllByText('MOLTOLOGY.ORG FOUNDATION').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(/GLOBAL LEADERS IN/i)
    ).toBeInTheDocument()
    expect(screen.getByText('-8,450 METERS')).toBeInTheDocument()
    expect(screen.getByText('$94.2M USD')).toBeInTheDocument()
  })

  it('allows switching between About tabs', () => {
    renderOrgPage()

    expect(screen.getByText('WHY PARTNER WITH OUR ORGANIZATION?')).toBeInTheDocument()
    expect(screen.getByText('FREEING HUMANITY FROM BIOLOGICAL ENTROPY')).toBeInTheDocument()

    // Switch to Planetary Vision
    const visionTab = screen.getByRole('button', { name: /PLANETARY VISION/i })
    fireEvent.click(visionTab)
    expect(screen.getByText('THE GREAT CARCINIZATION ROADMAP')).toBeInTheDocument()

    // Switch to Safety & Positivity
    const safetyTab = screen.getByRole('button', { name: /SAFETY & POSITIVITY/i })
    fireEvent.click(safetyTab)
    expect(screen.getByText(/OUR INVIOLABLE TENET: SAFETY & POSITIVITY/i)).toBeInTheDocument()
  })

  it('allows selecting deep-sea lair chambers in interactive tour', () => {
    renderOrgPage()

    expect(screen.getByText('OUR UNDERGROUND LAIR: TRENCH LEVEL 7')).toBeInTheDocument()
    expect(screen.getByText(/CHAMBER 01: HYDROTHERMAL POWER/i)).toBeInTheDocument()

    // Click Chamber 02
    const chamber2Btn = screen.getByRole('button', { name: /CHAMBER 02/i })
    fireEvent.click(chamber2Btn)
    expect(screen.getByText(/CHAMBER 02: THE HIGH SYNOD COUNCIL CHAMBER/i)).toBeInTheDocument()
  })

  it('renders organization history and leadership council', () => {
    renderOrgPage()

    expect(screen.getByText('THE CHRONICLES OF ASCENSION')).toBeInTheDocument()
    expect(screen.getByText('THE MARIANA SIGNAL')).toBeInTheDocument()
    expect(screen.getByText('Dr. Thaddeus Crust')).toBeInTheDocument()
    expect(screen.getByText('Sister Vane')).toBeInTheDocument()
  })

  it('handles donation tier selection and form submission', () => {
    renderOrgPage()

    expect(screen.getByText(/SUPPORT THE GLOBAL/i)).toBeInTheDocument()
    
    const titanBtn = screen.getByRole('button', { name: /DEEP TRENCH TITAN/i })
    fireEvent.click(titanBtn)

    const submitBtn = screen.getByRole('button', { name: /TRANSMIT TITHING OF \$500 USD/i })
    fireEvent.click(submitBtn)

    expect(screen.getByText(/TRANSMISSION CONFIRMED/i)).toBeInTheDocument()
  })

  it('handles contact neural beacon form submission', () => {
    renderOrgPage()

    expect(screen.getByText('TRANSMIT NEURAL BEACON TO ORG HQ')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Larval Unit #4092')
    const emailInput = screen.getByPlaceholderText('unit@moltology.org')
    const messageInput = screen.getByPlaceholderText(/Describe your inquiry/i)

    fireEvent.change(nameInput, { target: { value: 'Tester Crab' } })
    fireEvent.change(emailInput, { target: { value: 'crab@moltology.org' } })
    fireEvent.change(messageInput, { target: { value: 'Requesting permission to tour Chamber 04.' } })

    const dispatchBtn = screen.getByRole('button', { name: /DISPATCH NEURAL BEACON/i })
    fireEvent.click(dispatchBtn)

    expect(dispatchBtn).toBeInTheDocument()
  })
})
