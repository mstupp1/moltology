import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

type VercelRedirect = {
  source: string
  destination: string
  permanent: boolean
  has?: Array<{ type: string; key: string }>
}

const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
  redirects: VercelRedirect[]
}

describe('renamed page redirects', () => {
  it.each([
    ['/chassis', '/character'],
    ['/market', '/character/shop'],
    ['/pipeline', '/character/progress'],
    ['/stages', '/character/progress'],
    ['/lectures', '/academy'],
    ['/lectures/:path*', '/academy/:path*'],
    ['/stream', '/profile?tab=activity'],
    ['/connections', '/profile?tab=friends'],
    ['/friends', '/profile?tab=friends'],
    ['/landing', '/'],
    ['/what-is-moltology/what-moltologists-say', '/what-is-moltology#voices'],
  ])('sends %s to %s with a permanent redirect', (source, destination) => {
    expect(vercel.redirects).toContainEqual({ source, destination, permanent: true })
  })

  it.each(['/friends', '/connections'])('keeps a tab on %s by sending it to /profile with its own query', (source) => {
    expect(vercel.redirects).toContainEqual({
      source,
      has: [{ type: 'query', key: 'tab' }],
      destination: '/profile',
      permanent: true,
    })
    const withTab = vercel.redirects.findIndex((r) => r.source === source && r.has)
    const plain = vercel.redirects.findIndex((r) => r.source === source && !r.has)
    expect(withTab).toBeLessThan(plain)
  })
})
