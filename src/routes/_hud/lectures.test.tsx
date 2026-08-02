import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from './lectures'

describe('Molt Academy (Lectures Route)', () => {
  it('renders Molt Academy header and gamified user stats', () => {
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(screen.getByText('MOLT ACADEMY // NEURAL ASCENSION HUB')).toBeInTheDocument()
    expect(screen.getByText('LVL 4 CHITIN SCHOLAR')).toBeInTheDocument()
    expect(screen.getByText('1,850 / 2,500 XP')).toBeInTheDocument()
    expect(screen.getByText('5 DAYS')).toBeInTheDocument()
  })

  it('renders course catalog cards and supports course selection', () => {
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(screen.getByText('ACADEMY COURSE CATALOG & CURRICULA')).toBeInTheDocument()
    expect(screen.getAllByText('THE CHITINOUS MIND & NEURAL ECDYSIS').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')).toBeInTheDocument()

    // Test clicking unlocked course
    const introCourseCard = screen.getByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')
    fireEvent.click(introCourseCard)

    // Active course heading should update
    const activeHeadings = screen.getAllByText('INTRODUCTION TO ECDYSIS & SHELL SHEDDING')
    expect(activeHeadings.length).toBeGreaterThanOrEqual(2)
  })

  it('renders active video broadcast player with playback controls and notes', () => {
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(screen.getByText('NEURAL BROADCAST STREAM')).toBeInTheDocument()
    expect(screen.getByText('LECTURE NOTES')).toBeInTheDocument()
    expect(screen.getByText('AI NEURAL INTERPRETATION')).toBeInTheDocument()
  })

  it('renders syllabus sidebar and handles neural quiz interaction', () => {
    const LecturesComponent = Route.options.component!
    render(<LecturesComponent />)

    expect(screen.getByText('COURSE SYLLABUS & MODULES')).toBeInTheDocument()
    expect(screen.getByText('NEURAL RESONANCE VERIFICATION QUIZ')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /SUBMIT NEURAL VERIFICATION/i })
    expect(submitBtn).toBeDisabled()

    // Select option B
    const optionB = screen.getByText(/B\) To align cognitive capacity with hard chassis/i)
    fireEvent.click(optionB)

    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    expect(screen.getByText('RESONANCE VERIFICATION PASSED (+150 XP EARNED)')).toBeInTheDocument()
  })
})
