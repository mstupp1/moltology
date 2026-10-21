import React, { useEffect, useState } from 'react'
import { getStoreAccessFn } from '@/lib/server/merch-api'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { MainFooter } from '@/components/MainFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { CartDrawer } from './CartDrawer'
import { MerchCartProvider } from './MerchCartProvider'

function StoreBody() {
  return (
    <MerchCartProvider>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <CartDrawer />
    </MerchCartProvider>
  )
}

export function StoreShell() {
  const navigate = useNavigate()
  const path = useLocation({ select: l => l.pathname })
  const [publicEnabled, setPublicEnabled] = useState(false)
  useEffect(() => { void getStoreAccessFn().then(a => setPublicEnabled(a.publicEnabled)).catch(() => undefined) }, [])
  return (
    <div className="min-h-screen bg-abyss text-ink">
      <PublicHeader activePage="store" onOpenAuth={(mode) => { void navigate({ to: '/auth', search: { mode, redirect: '/store' } }) }} />
      {/* Clears the fixed header. */}
      <div className="pt-20">
        {publicEnabled || path === '/store/status' ? (
          <StoreBody />
        ) : (
          <HiddenPageGuard experiment="new-store" skeleton={<div className="mx-auto max-w-7xl px-4 py-10"><HUDPageLoader /></div>}>
            <StoreBody />
          </HiddenPageGuard>
        )}
      </div>
      <MainFooter />
    </div>
  )
}
