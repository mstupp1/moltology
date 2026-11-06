import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

type VercelRedirect = { source: string; destination: string; permanent: boolean }

const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
  redirects: VercelRedirect[]
}

describe('renamed page redirects', () => {
  it.each([
    ['/chassis', '/character'],
    ['/market', '/character/shop'],
    ['/pipeline', '/stages'],
    ['/lectures', '/academy'],
    ['/lectures/:path*', '/academy/:path*'],
    ['/stream', '/friends?tab=feed'],
    ['/connections', '/friends'],
    ['/landing', '/'],
    ['/what-is-moltology/what-moltologists-say', '/what-is-moltology#voices'],
  ])('sends %s to %s with a permanent redirect', (source, destination) => {
    expect(vercel.redirects).toContainEqual({ source, destination, permanent: true })
  })
})
