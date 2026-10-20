import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CareerHub, JOB_LISTINGS, PERKS, HIRING_STEPS } from './CareerHub'

describe('CareerHub', () => {
  it('lists every open role, the perks and the hiring steps', () => {
    render(<CareerHub />)

    expect(screen.getByText('Work with us')).toBeInTheDocument()
    for (const job of JOB_LISTINGS) expect(screen.getByText(job.title)).toBeInTheDocument()
    for (const perk of PERKS) expect(screen.getByText(perk.title)).toBeInTheDocument()
    for (const step of HIRING_STEPS) expect(screen.getByText(step.title)).toBeInTheDocument()
  })

  it('filters roles by team', () => {
    render(<CareerHub />)

    fireEvent.click(screen.getByRole('button', { name: 'Member care' }))
    expect(screen.getByText('Member onboarding guide')).toBeInTheDocument()
    expect(screen.queryByText('Platform engineer')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All roles' }))
    expect(screen.getByText('Platform engineer')).toBeInTheDocument()
  })

  it('shows role details on demand and hands the role to onApply', () => {
    const onApply = vi.fn()
    render(<CareerHub onApply={onApply} />)

    const details = screen.getAllByRole('button', { name: /Details/i })[0]
    expect(screen.queryByText("What you'll do")).not.toBeInTheDocument()
    fireEvent.click(details)
    expect(details).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText("What you'll do")).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Apply for Platform engineer' }))
    expect(onApply).toHaveBeenCalledWith(JOB_LISTINGS[0])
  })

  it('has no mock application form', () => {
    render(<CareerHub />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
