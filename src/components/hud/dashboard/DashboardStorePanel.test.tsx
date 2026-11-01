import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { getMerchCatalogFn, getStoreAccessFn } from '@/lib/server/merch-api'
import { merchCatalogView } from '@/lib/merch-seed-data'
import { DASHBOARD_STORE_LIMIT, DashboardStorePanel } from './DashboardStorePanel'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, params, ...props }: any) => <a href={String(to).replace('$slug', params?.slug ?? '')} {...props}>{children}</a>,
}))
vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => ({ userId: 'u1' }) }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('t') }))
vi.mock('@/lib/server/merch-api', () => ({ getMerchCatalogFn: vi.fn(), getStoreAccessFn: vi.fn() }))

const catalog = merchCatalogView()

beforeEach(() => {
  vi.mocked(getMerchCatalogFn).mockResolvedValue(catalog as never)
  vi.mocked(getStoreAccessFn).mockResolvedValue({ orderingOpen: false, checkoutPaused: false } as never)
})

describe('DashboardStorePanel', () => {
  it('promotes store pieces without prices while ordering is closed', async () => {
    render(<DashboardStorePanel />)
    const panel = await screen.findByTestId('dashboard-store')
    expect(panel).not.toHaveTextContent(/Mugs and tees|Ordering opens soon/)
    expect(screen.getAllByRole('link')).toHaveLength(Math.min(DASHBOARD_STORE_LIMIT, catalog.length))
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
    expect(screen.queryByText(/\$\d/)).toBeNull()
  })

  it('shows prices once ordering opens', async () => {
    vi.mocked(getStoreAccessFn).mockResolvedValue({ orderingOpen: true, checkoutPaused: false } as never)
    render(<DashboardStorePanel />)
    expect((await screen.findAllByText(/\$\d/)).length).toBeGreaterThan(0)
  })

  it('uses separate transparent dashboard images without changing catalog photos', async () => {
    vi.mocked(getMerchCatalogFn).mockResolvedValue(catalog.filter(product => ['moltology-mug', 'moltology-tee'].includes(product.slug)) as never)
    render(<DashboardStorePanel />)
    await screen.findByTestId('dashboard-store')
    expect(screen.getByAltText('White Moltology mug with red emblem')).toHaveAttribute('src', '/media/images/merch/dashboard/2026-10-21/moltology-mug-v2.webp')
    expect(screen.getByAltText('Black Moltology tee, front')).toHaveAttribute('src', '/media/images/merch/dashboard/2026-10-21/moltology-tee-v2.webp')
    expect(screen.getByAltText('White Moltology mug with red emblem').parentElement).toHaveClass('bg-benthic-border')
    expect(screen.getByAltText('Black Moltology tee, front').parentElement).toHaveClass('bg-benthic-border')
    expect(catalog.find(product => product.slug === 'moltology-mug')?.featuredImageUrl).toBe('images/merch/moltology-mug-v2-1.jpg')
  })

  it('stays hidden when the store is not open to this member', async () => {
    vi.mocked(getMerchCatalogFn).mockRejectedValue(new Error('This page is not available.'))
    const { container } = render(<DashboardStorePanel />)
    await waitFor(() => expect(getMerchCatalogFn).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
