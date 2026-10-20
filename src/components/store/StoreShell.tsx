import React from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { MainFooter } from '@/components/MainFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { MERCH_PREVIEW } from '@/lib/merch-preview'
import { CartDrawer } from './CartDrawer'
import { MerchCartProvider } from './MerchCartProvider'

function StoreBody() {
  return (
    <MerchCartProvider>
      {MERCH_PREVIEW ? (
        <div className="border-b border-line-subtle bg-surface-1 px-4 py-2 text-center text-xs text-ink-muted" data-testid="merch-preview-banner">
          Preview mode: the catalog comes from the catalog file and checkout is off.
        </div>
      ) : null}
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <CartDrawer />
    </MerchCartProvider>
  )
}

export function StoreShell() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-abyss text-ink">
      <PublicHeader activePage="store" onOpenAuth={(mode) => { void navigate({ to: '/auth', search: { mode, redirect: '/store' } }) }} />
      {/* Clears the fixed header. */}
      <div className="pt-20">
        {MERCH_PREVIEW ? (
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
