import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // Show the HUD page loader after 200 ms on any slow route transition.
    defaultPendingComponent: HUDPageLoader,
    defaultPendingMs: 200,
    defaultPendingMinMs: 500,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
