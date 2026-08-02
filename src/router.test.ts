import { describe, it, expect } from 'vitest'
import { getRouter } from './router'

describe('TanStack Router Configuration', () => {
  it('instantiates the router successfully', () => {
    const router = getRouter()
    expect(router).toBeDefined()
    expect(router.options.scrollRestoration).toBe(true)
  })

  it('contains registered routes in route tree', () => {
    const router = getRouter()
    expect(router.routeTree).toBeDefined()
  })
})
