import React from 'react'
import { Outlet } from '@tanstack/react-router'
import { HiddenPageGuard } from '@/components/hud/HiddenPageGuard'
import { MainFooter } from '@/components/MainFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { CartDrawer } from './CartDrawer'
import { MerchCartProvider } from './MerchCartProvider'

export function StoreShell() {
  return (
    <div className="min-h-screen bg-[#030607] text-[#dfe3e3]">
      <PublicHeader activePage="store" />
      <HiddenPageGuard skeleton={<div className="mx-auto max-w-6xl px-4 py-10"><HUDPageLoader /></div>}>
        <MerchCartProvider>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <Outlet />
          </main>
          <CartDrawer />
        </MerchCartProvider>
      </HiddenPageGuard>
      <MainFooter />
    </div>
  )
}
