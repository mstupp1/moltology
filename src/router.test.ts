import { describe, it, expect } from 'vitest'
import { getRouter } from './router'

describe('TanStack Router Configuration', () => {
  it('instantiates the router successfully', () => {
    const router = getRouter()
    expect(router).toBeDefined()
    expect(router.options.scrollRestoration).toBe(true)
  })

  it('configures defaultNotFoundComponent and defaultPendingComponent', () => {
    const router = getRouter()
    expect(router.options.defaultNotFoundComponent).toBeDefined()
    expect(router.options.defaultPendingComponent).toBeDefined()
  })
})
