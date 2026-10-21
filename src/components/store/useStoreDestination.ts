import { useEffect, useState } from 'react'
import { getStoreAccessFn } from '@/lib/server/merch-api'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { ETSY_STORE_HREF, NATIVE_STORE_PATH } from '@/lib/merch'

/**
 * Once the store is public everyone gets /store. Before that, guests and members keep the Etsy
 * store and opted-in admins get the on-site store once access has resolved. Until then the link stays on Etsy so members never see a flash of /store.
 */
export function useStoreDestination(): { href: string; external: boolean } {
  const [publicEnabled, setPublicEnabled] = useState(false)
  useEffect(() => { void getStoreAccessFn().then(a => setPublicEnabled(a.publicEnabled)).catch(() => undefined) }, [])
  const access = useHiddenPageAccess('new-store')
  const native = publicEnabled || (!access.pending && access.canView)
  return native
    ? { href: NATIVE_STORE_PATH, external: false }
    : { href: ETSY_STORE_HREF, external: true }
}
