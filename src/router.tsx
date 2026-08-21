import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { HUDNotFound } from '@/components/hud/HUDNotFound'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: HUDNotFound,
    // Preload routes on intent (hover/focus) for instant navigation transitions.
    defaultPreload: 'intent',
    defaultPreloadDelay: 50,
    defaultPendingComponent: HUDPageLoader,
    defaultPendingMs: 250,
    defaultPendingMinMs: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
