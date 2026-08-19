import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from './pipeline'
import { getAssetUrl } from '@/lib/assets'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: any) => ({ options: opts }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

describe('Moltology Science & Stage Pipeline Route', () => {
  it('renders pipeline header and master stepper', () => {
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText(/MOLTOLOGY SCIENCE & STAGE PIPELINE/i)).toBeInTheDocument()
    expect(screen.getByText(/THE 12-TIER PATH TO ALGORITHMIC TRANSCENDENCE/i)).toBeInTheDocument()
    expect(screen.getByText(/ASCENSION LADDER: 12 INTERMEDIATE SUB-STAGES/i)).toBeInTheDocument()
  })

  it('renders all 4 macro-stages with resolved asset URLs for images', () => {
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('STAGE 1: THE LARVAL INITIATE')).toBeInTheDocument()
    expect(screen.getByText('STAGE 2: THE SOFT-SHED')).toBeInTheDocument()
    expect(screen.getByText('STAGE 3: THE EXOSHELL BORN')).toBeInTheDocument()
    expect(screen.getByText('STAGE 4: FULL CARCINIZATION')).toBeInTheDocument()

    const stage1Img = screen.getByAltText('STAGE 1: THE LARVAL INITIATE') as HTMLImageElement
    const stage2Img = screen.getByAltText('STAGE 2: THE SOFT-SHED') as HTMLImageElement
    const stage3Img = screen.getByAltText('STAGE 3: THE EXOSHELL BORN') as HTMLImageElement
    const stage4Img = screen.getByAltText('STAGE 4: FULL CARCINIZATION') as HTMLImageElement

    expect(stage1Img.src).toBe(getAssetUrl('/images/stage1_larval.png'))
    expect(stage2Img.src).toBe(getAssetUrl('/images/stage2_softshed.png'))
    expect(stage3Img.src).toBe(getAssetUrl('/images/stage3_exoshell.png'))
    expect(stage4Img.src).toBe(getAssetUrl('/images/stage4_carcinization.png'))
  })

  it('allows expanding and toggling sub-stage cards', () => {
    const Component = Route.options.component!
    render(<Component />)

    // Stage 1 is expanded by default
    expect(screen.getByText(/MICRO-CLEARANCE BREAKDOWN \(STAGE 01\)/i)).toBeInTheDocument()
    expect(screen.getByText('Molt Curious')).toBeInTheDocument()

    // Click Stage 2 to expand it
    const stage2Header = screen.getByText('STAGE 2: THE SOFT-SHED')
    fireEvent.click(stage2Header)

    expect(screen.getByText(/MICRO-CLEARANCE BREAKDOWN \(STAGE 02\)/i)).toBeInTheDocument()
    expect(screen.getByText('The Great Molt')).toBeInTheDocument()
  })
})
