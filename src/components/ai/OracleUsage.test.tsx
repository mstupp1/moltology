import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OracleUsage, PlanUsageSection } from './OracleUsage'
import { buildOracleUsageSnapshot } from '@/lib/ai/usage-limits'
import { useOracleUsage } from '@/hooks/useOracleUsage'

vi.mock('@/hooks/useOracleUsage', () => ({ useOracleUsage: vi.fn() }))
vi.mock('@/hooks/useHiddenPageAccess', () => ({ useHiddenPageAccess: () => ({ canView: false, pending: false }) }))
const now = new Date('2026-10-25T12:00:00Z')
const ago = (hours: number) => new Date(now.getTime() - hours * 60 * 60_000)
beforeEach(() => { vi.clearAllMocks() })
describe('quiet Oracle usage', () => {
  it('shows the five-hour allowance and expands to weekly usage', () => {
    render(<OracleUsage snapshot={buildOracleUsageSnapshot([ago(1), ago(1), ago(1)], false, now)} unavailable={false} />)
    expect(screen.getByText('12 of 15 remaining · Past 5 hours')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'View usage' }))
    expect(screen.getByText('97 of 100 remaining · Past 7 days')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide usage' })).toHaveAttribute('aria-expanded', 'true')
  })
  it('gently highlights the allowance at 20 percent remaining', () => {
    render(<OracleUsage snapshot={buildOracleUsageSnapshot(Array.from({ length: 12 }, () => ago(1)), false, now)} unavailable={false} />)
    expect(screen.getByText('3 of 15 remaining · Past 5 hours')).toHaveClass('text-amber-300')
  })
  it('surfaces a weekly block even with details collapsed and shows availability', () => {
    const snapshot = buildOracleUsageSnapshot(Array.from({ length: 100 }, () => ago(24)), false, now)
    render(<OracleUsage snapshot={snapshot} unavailable={false} />)
    expect(screen.getByRole('status')).toHaveTextContent('7-day allowance used. Next message available')
    expect(screen.getByText('15 of 15 remaining · Past 5 hours')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(1)
  })
  it('shows both exhausted windows', () => {
    render(<OracleUsage snapshot={buildOracleUsageSnapshot(Array.from({ length: 100 }, () => ago(1)), false, now)} unavailable={false} />)
    expect(screen.getByRole('status')).toHaveTextContent('5-hour and 7-day allowance used.')
  })
  it('never invents usage during loading or failure and marks stale readings', () => {
    const view = render(<OracleUsage snapshot={null} unavailable={false} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    view.rerender(<OracleUsage snapshot={null} unavailable />)
    expect(screen.getByText('Usage unavailable. Try again shortly.')).toBeInTheDocument()
    view.rerender(<OracleUsage snapshot={buildOracleUsageSnapshot([], false, now)} unavailable />)
    expect(screen.getByText('Usage unavailable. Showing the last reading.')).toBeInTheDocument()
  })
  it('shows both windows and plan in Settings without a hidden Oracle MAX link', () => {
    vi.mocked(useOracleUsage).mockReturnValue({ snapshot: buildOracleUsageSnapshot([], true, now), unavailable: false, blocked: false, refresh: vi.fn() })
    const view = render(<PlanUsageSection userId="member" />)
    expect(screen.getByText('Oracle MAX plan · Oracle messages')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(2)
    expect(screen.queryByRole('link', { name: 'View Oracle MAX' })).not.toBeInTheDocument()
    view.rerender(<PlanUsageSection userId={null} />)
    expect(screen.queryByText('Plan & usage')).not.toBeInTheDocument()
  })
})
