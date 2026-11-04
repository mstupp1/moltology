import { beforeEach, describe, expect, it, vi } from 'vitest'
const lookup = vi.hoisted(() => vi.fn())
vi.mock('@/lib/server/member-share', () => ({ getMemberShareIdentityFn: lookup }))
import { Route } from './$profileId'

const loader = Route.options.loader as (args: { params: { profileId: string } }) => Promise<unknown>
const head = Route.options.head as (args: { loaderData: unknown }) => { meta: unknown[] }
beforeEach(() => vi.resetAllMocks())
describe('profile share metadata', () => {
  it('loads the public identity before emitting server-rendered preview tags', async () => {
    lookup.mockResolvedValue({ userId: 'opaque-account-id', handle: 'mstupp', larvaId: 'LARVA UNIT #1234' })
    const data = await loader({ params: { profileId: 'opaque-account-id' } })
    expect(lookup).toHaveBeenCalledWith({ data: { profileId: 'opaque-account-id' } })
    expect(head({ loaderData: data }).meta).toContainEqual({ property: 'og:title', content: 'Add mstupp on Moltology' })
    expect(JSON.stringify(head({ loaderData: data }).meta)).not.toContain('opaque-account-id')
  })
  it('uses a generic preview when lookup fails, without treating the account id as a name', async () => {
    lookup.mockRejectedValue(new Error('unavailable'))
    const data = await loader({ params: { profileId: 'opaque-account-id' } })
    expect(data).toBeNull()
    expect(head({ loaderData: data }).meta).toContainEqual({ title: 'Member Dossier | Moltology' })
  })
})
