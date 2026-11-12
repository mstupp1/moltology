import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/client'
import { routeTree } from './routeTree.gen'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { HUDNotFound } from '@/components/hud/HUDNotFound'

export function getRouter() {
  // Account data cache (TanStack Query). See src/lib/query/ and AGENTS.md "Loading account data".
  const queryClient = getQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient },
    Wrap: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
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
