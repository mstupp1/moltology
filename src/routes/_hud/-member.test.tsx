import { describe, it, expect } from 'vitest'
import { Route } from './member/$profileId'
import { MEMBER_PROFILE_SEO } from '@/lib/seo'
import {
  memberDossierLocation,
  pickProfileForRouteKey,
  resolveMemberDossierRedirect,
  resolveMemberPublicName,
  resolveMemberPublicParam,
} from '@/lib/member-handle'

const MEMBER_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

describe('/member/$profileId dossier route', () => {
  it('titles the page as an invite from the shared identity, falling back to the dossier title', () => {
    const head = Route.options.head as (ctx: {
      loaderData?: { handle?: string | null; userId?: string | null } | null
    }) => { meta: Array<{ title?: string; name?: string; content?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const titleFor = (loaderData: { handle?: string | null; userId?: string | null } | null) =>
      head({ loaderData }).meta.find((entry) => entry.title)?.title

    const larvaName = resolveMemberPublicName({ userId: MEMBER_UUID })

    expect(titleFor({ handle: 'mstupp', userId: MEMBER_UUID })).toBe('Add mstupp on Moltology')
    expect(titleFor({ userId: MEMBER_UUID })).toBe(`Add ${larvaName} on Moltology`)
    expect(larvaName).toMatch(/^LARVA UNIT #/)
    expect(titleFor(null)).toBe(MEMBER_PROFILE_SEO.title)
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(head({ loaderData: null }).meta).toEqual(
      expect.arrayContaining([{ name: 'robots', content: 'noindex, nofollow' }]),
    )
    expect(Route.options.pendingComponent).toBeDefined()
  })

  it('resolves a claimed designation case-insensitively and keeps the stored spelling', () => {
    const stored = { id: MEMBER_UUID, handle: 'mstupp' }
    expect(pickProfileForRouteKey('mstupp', [stored])).toEqual(stored)
    expect(pickProfileForRouteKey('MSTUPP', [stored])).toEqual(stored)
    expect(pickProfileForRouteKey(MEMBER_UUID, [stored])).toEqual(stored)
    expect(resolveMemberPublicParam(stored)).toBe('mstupp')
    expect(memberDossierLocation(stored).params.profileId).toBe('mstupp')
  })

  it('redirects /member/<uuid> to the stored designation and leaves unclaimed uuids in place', () => {
    const claimed = { id: MEMBER_UUID, handle: 'mstupp' }
    const unclaimed = { id: MEMBER_UUID, handle: null }

    expect(resolveMemberDossierRedirect(MEMBER_UUID, claimed)).toBe('mstupp')
    expect(resolveMemberDossierRedirect('MSTUPP', claimed)).toBe('mstupp')
    expect(resolveMemberDossierRedirect('mstupp', claimed)).toBeNull()
    expect(resolveMemberDossierRedirect(MEMBER_UUID, unclaimed)).toBeNull()
    expect(resolveMemberPublicParam(unclaimed)).toBe(MEMBER_UUID)
    expect(memberDossierLocation(unclaimed).params.profileId).toBe(MEMBER_UUID)
  })
})
