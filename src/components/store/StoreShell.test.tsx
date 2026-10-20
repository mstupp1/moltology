vi.mock('@/lib/server/merch-api', () => ({ getStoreAccessFn: vi.fn().mockResolvedValue({ publicEnabled: false }) }))
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ Outlet: () => null, useNavigate: () => navigate, useLocation: () => '/store' }))
vi.mock('@/components/PublicHeader', () => ({ PublicHeader: ({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'signup') => void }) => <button onClick={() => onOpenAuth('login')}>Log in</button> }))
vi.mock('@/components/hud/HiddenPageGuard', () => ({ HiddenPageGuard: () => <p>Private store</p> }))
vi.mock('@/components/MainFooter', () => ({ MainFooter: () => null }))
vi.mock('./CartDrawer', () => ({ CartDrawer: () => null }))
vi.mock('./MerchCartProvider', () => ({ MerchCartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
import { StoreShell } from './StoreShell'
describe('private store sign-in', () => {
  it('sends the header login action to auth and returns to the store', () => {
    render(<StoreShell />)
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/auth', search: { mode: 'login', redirect: '/store' } })
  })
})
