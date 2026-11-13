import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/client'
import { FRESH, registerRouteCache } from '@/lib/query/content'
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
    // Going back to a page reuses what its loader already fetched instead of reading again.
    // Forum routes set a shorter window; forum writes clear the forum's saved pages.
    defaultStaleTime: FRESH.content,
    // A hover preload saves the page for the same window (the router default is 30 seconds).
    defaultPreloadStaleTime: FRESH.content,
    defaultPendingComponent: HUDPageLoader,
    defaultPendingMs: 250,
    defaultPendingMinMs: 0,
  })
  registerRouteCache(router)

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
