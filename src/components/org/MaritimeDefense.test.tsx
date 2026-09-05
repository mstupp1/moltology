import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MaritimeDefense } from './MaritimeDefense'
import { OrgDivisions } from './OrgDivisions'
import { OceanStewardship } from './OceanStewardship'
import { ToastProvider } from '@/components/ui/ToastProvider'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  createFileRoute: () => (config: any) => config,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

const renderMaritime = (onSupport?: () => void) =>
  render(
    <ToastProvider>
      <MaritimeDefense onSupport={onSupport} />
    </ToastProvider>
  )

describe('OrgDivisions', () => {
  it('renders all six divisions with identification codes', () => {
    render(<OrgDivisions />)

    expect(screen.getByText('DEPARTMENT OF CARCINIZATION')).toBeInTheDocument()
    expect(screen.getByText('OFFICE OF SYNAPTIC DEVELOPMENT')).toBeInTheDocument()
    expect(screen.getByText('MARITIME DEFENSE COMMAND')).toBeInTheDocument()
    expect(screen.getByText('OFFICE OF CEPHALOPOD AFFAIRS')).toBeInTheDocument()
    expect(screen.getByText('BUREAU OF SHELL INFRASTRUCTURE')).toBeInTheDocument()
    expect(screen.getByText('DEPARTMENT OF AQUATIC FREEDOM')).toBeInTheDocument()
    expect(screen.getByText('DIV-04 · OCA')).toBeInTheDocument()
  })
})

describe('MaritimeDefense branch', () => {
  it('renders the branch masthead and the standing message', () => {
    renderMaritime()

    expect(screen.getByRole('heading', { name: /MARITIME DEFENSE & OCEAN STEWARDSHIP/i })).toBeInTheDocument()
    expect(
      screen.getByText('Protecting the reef. Preserving crab sovereignty. Monitoring cephalopod activity.')
    ).toBeInTheDocument()
    expect(screen.getByText('SAVE THE OCEAN.')).toBeInTheDocument()
    expect(screen.getByText("BECAUSE IF WE DON'T, THE OCTOPUSES WIN.")).toBeInTheDocument()
  })

  it('defaults the threat advisory to ORANGE and lets a level be selected', () => {
    renderMaritime()

    expect(screen.getByRole('heading', { name: /CURRENT MARINE THREAT ADVISORY/i })).toBeInTheDocument()
    expect(screen.getByText('LEVEL ORANGE')).toBeInTheDocument()
    expect(screen.getByText('CURRENT POSTURE')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /BLACK — DOLPHIN INTELLIGENCE EVENT/i }))
    expect(screen.getByText('LEVEL BLACK')).toBeInTheDocument()
    expect(screen.getAllByText(/Further information classified/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the cephalopod dossier with expandable characteristics', () => {
    renderMaritime()

    const dossier = within(screen.getByRole('region', { name: /OFFICE OF CEPHALOPOD AFFAIRS/i }))
    expect(dossier.getByText('PRIMARY THREAT: OCTOPUS')).toBeInTheDocument()
    expect(dossier.getByText('DO NOT BE DECEIVED BY THEIR SOFT BODIES.')).toBeInTheDocument()
    expect(dossier.getByText('EIGHT ARMS. ZERO ACCOUNTABILITY.')).toBeInTheDocument()

    const trait = screen.getByRole('button', { name: /NO DEMONSTRATED RESPECT FOR CRAB SOVEREIGNTY/i })
    expect(trait).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trait)
    expect(trait).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders the six sovereignty articles', () => {
    renderMaritime()

    expect(screen.getByRole('heading', { name: /CRAB SOVEREIGNTY IS NON-NEGOTIABLE/i })).toBeInTheDocument()
    expect(screen.getByText('THE RIGHT TO BEAR CLAWS')).toBeInTheDocument()
    expect(screen.getByText('FREEDOM FROM UNWARRANTED TENTACLE SEARCH')).toBeInTheDocument()
    expect(screen.getByText('THE RIGHT TO MOVE SIDEWAYS WITHOUT EXPLANATION')).toBeInTheDocument()
  })

  it('renders the five-point maritime strategy', () => {
    renderMaritime()

    expect(screen.getByRole('heading', { name: /THE FIVE-POINT PLAN FOR MARITIME DOMINANCE/i })).toBeInTheDocument()
    expect(screen.getByText('BUILD FREEDOM REEFS')).toBeInTheDocument()
    expect(screen.getByText('MAKE THE OCEAN WILD AGAIN')).toBeInTheDocument()
  })

  it('lets a Freedom Reef site be selected from the registry', () => {
    renderMaritime()

    expect(screen.getByText(/Fourteen hundred cast-shell modules/i)).toBeInTheDocument()

    const reefs = within(screen.getByRole('region', { name: /FREEDOM REEFS/i }))
    const clawPointButtons = reefs.getAllByRole('button', { name: /CLAW POINT/i })
    fireEvent.click(clawPointButtons[clawPointButtons.length - 1])

    expect(reefs.getByText(/Three crab traps have gone missing here since spring/i)).toBeInTheDocument()
    expect(reefs.getByText('CONTESTED')).toBeInTheDocument()
  })

  it('renders the deep state evidence board without drawing a conclusion', () => {
    renderMaritime()

    expect(screen.getByRole('heading', { name: /THE DEEP STATE IS LITERALLY DEEP/i })).toBeInTheDocument()
    expect(screen.getByText('MISSING CRAB TRAPS')).toBeInTheDocument()
    expect(screen.getByText('SUSPICIOUSLY INTELLIGENT DOLPHINS')).toBeInTheDocument()
    expect(screen.getByText(/WE.RE JUST ASKING QUESTIONS\./i)).toBeInTheDocument()
  })

  it('renders the smaller institutional programs and campaign plates', () => {
    renderMaritime()

    expect(screen.getByText('RAISE TOUGHER CRABS')).toBeInTheDocument()
    expect(screen.getByText('STOP CRITICAL REEF THEORY')).toBeInTheDocument()
    expect(screen.getByText('COLD WATER.')).toBeInTheDocument()
    expect(screen.getByText('MOLT FREE OR DIE.')).toBeInTheDocument()
    expect(screen.getByText('SHELLS BEFORE TENTACLES.')).toBeInTheDocument()
  })

  it('opens the octopus sighting form and confirms submission', () => {
    renderMaritime()

    expect(screen.getByText('ADOPT A CRAB')).toBeInTheDocument()
    expect(screen.queryByLabelText('Location of sighting')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /OPEN THE SIGHTING FORM/i }))

    const location = screen.getByLabelText('Location of sighting')
    const behavior = screen.getByLabelText('Description of suspicious behavior')
    fireEvent.change(location, { target: { value: 'Pier piling, sector 11' } })
    fireEvent.change(behavior, { target: { value: 'It opened the container and then closed it again.' } })
    fireEvent.change(screen.getByLabelText('Number of arms observed'), { target: { value: 'lost-count' } })

    fireEvent.click(screen.getByRole('button', { name: /SUBMIT SIGHTING REPORT/i }))

    expect(screen.getByText('YOUR REPORT HAS BEEN FORWARDED TO MARITIME INTELLIGENCE.')).toBeInTheDocument()
    expect(screen.getByText(/Nothing you entered was saved or transmitted/i)).toBeInTheDocument()
  })

  it('routes the non-report action cards to the support handler', () => {
    const onSupport = vi.fn()
    renderMaritime(onSupport)

    fireEvent.click(screen.getByRole('button', { name: /REVIEW ADOPTION TERMS/i }))
    expect(onSupport).toHaveBeenCalledTimes(1)
  })
})

describe('OceanStewardship', () => {
  it('renders real conservation actions and the fiction disclosure', () => {
    render(<OceanStewardship />)

    const section = screen.getByRole('region', { name: /No, seriously — help the ocean/i })
    expect(within(section).getByText('Cut single-use plastics')).toBeInTheDocument()
    expect(within(section).getByText('Choose responsible seafood')).toBeInTheDocument()
    expect(within(section).getByText('Reduce fertilizer and runoff')).toBeInTheDocument()

    expect(screen.getByText('About this page')).toBeInTheDocument()
    expect(screen.getByText(/Moltology is a fictional organization/i)).toBeInTheDocument()
    expect(screen.getByText(/Octopuses are not organized, not hostile/i)).toBeInTheDocument()
  })
})
