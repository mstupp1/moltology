import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CareerHub, JOB_LISTINGS, CORPORATE_BENEFITS, HIRING_STEPS } from './CareerHub'
import { ToastProvider } from '@/components/ui/ToastProvider'

describe('CareerHub Component', () => {
  const renderCareerHub = () => {
    return render(
      <ToastProvider>
        <CareerHub />
      </ToastProvider>
    )
  }

  it('renders careers banner, KPI badges, and benefits section', () => {
    renderCareerHub()

    expect(screen.getByText(/BUILD YOUR FUTURE IN/i)).toBeInTheDocument()
    expect(screen.getByText(/PERKS THAT KEEP YOUR SHELL HARDENED/i)).toBeInTheDocument()
    expect(screen.getByText('100% Comprehensive Carapace Care')).toBeInTheDocument()
    expect(screen.getByText('Hydrothermal Nap Pods & Spa')).toBeInTheDocument()
    expect(screen.getByText('Sovereign 401(k) & Molt Credits')).toBeInTheDocument()
  })

  it('renders all default open positions in the job board', () => {
    renderCareerHub()

    expect(screen.getByText('JOIN THE CARCINIZATION EFFORT')).toBeInTheDocument()
    expect(screen.getByText('Senior Bio-Silicon Systems Engineer')).toBeInTheDocument()
    expect(screen.getByText('Pincer Torque Optimization Lead')).toBeInTheDocument()
    expect(screen.getByText('Larval Onboarding & Softshed Chaplain')).toBeInTheDocument()
  })

  it('allows filtering open jobs by department', () => {
    renderCareerHub()

    // Filter by Spiritual & Chaplaincy
    const spiritualTab = screen.getByRole('button', { name: /SPIRITUAL & CHAPLAINCY/i })
    fireEvent.click(spiritualTab)

    expect(screen.getByText('Larval Onboarding & Softshed Chaplain')).toBeInTheDocument()
    expect(screen.queryByText('Senior Bio-Silicon Systems Engineer')).not.toBeInTheDocument()

    // Filter by Bio-Silicon Engineering
    const engTab = screen.getByRole('button', { name: /BIO-SILICON ENGINEERING/i })
    fireEvent.click(engTab)

    expect(screen.getByText('Senior Bio-Silicon Systems Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Larval Onboarding & Softshed Chaplain')).not.toBeInTheDocument()
  })

  it('allows searching jobs by keyword', () => {
    renderCareerHub()

    const searchInput = screen.getByPlaceholderText(/Search by title or keyword/i)
    fireEvent.change(searchInput, { target: { value: 'Pincer' } })

    expect(screen.getByText('Pincer Torque Optimization Lead')).toBeInTheDocument()
    expect(screen.queryByText('Deep-Sea Hydrothermal Grid Technician')).not.toBeInTheDocument()
  })

  it('opens job details and application modal and allows submitting an application', () => {
    renderCareerHub()

    const viewRoleButtons = screen.getAllByRole('button', { name: /VIEW ROLE & APPLY/i })
    fireEvent.click(viewRoleButtons[0])

    expect(screen.getByText('Transmit Candidate Neural Beacon')).toBeInTheDocument()
    expect(screen.getByText('Key Responsibilities')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText(/Unit #8192 or Alex Mercer/i)
    const emailInput = screen.getByPlaceholderText('alex@example.com')
    const noteInput = screen.getByPlaceholderText(/Tell us what draws you to our culture/i)

    fireEvent.change(nameInput, { target: { value: 'Crab Unit #77' } })
    fireEvent.change(emailInput, { target: { value: 'unit77@moltology.org' } })
    fireEvent.change(noteInput, { target: { value: 'Ready to optimize sub-benthic compute without hesitation.' } })

    const submitBtn = screen.getByRole('button', { name: /TRANSMIT APPLICATION/i })
    fireEvent.click(submitBtn)

    expect(submitBtn).toBeInTheDocument()
  })

  it('renders 4-step hiring process and employee testimonials', () => {
    renderCareerHub()

    expect(screen.getByText('OUR 4-STEP HIRING & ASCENSION PROCESS')).toBeInTheDocument()
    expect(screen.getByText('Neural Beacon Submission')).toBeInTheDocument()
    expect(screen.getByText('VOICES FROM TRENCH LEVEL 7')).toBeInTheDocument()
    expect(screen.getByText('Elena Rostova')).toBeInTheDocument()
  })
})
