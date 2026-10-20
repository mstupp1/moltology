import { useEffect, useState } from 'react'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAIThreadsFn } from '@/lib/server/api'
import { oracleAuthData } from '@/lib/ai/oracle-auth-client'
import { pickLastActiveOracleThread, type OracleThreadLike } from '@/lib/ai/last-oracle-thread'

/**
 * The member's most recently active Oracle thread. Reads the Oracle provider when it is mounted,
 * otherwise fetches the thread list once. Null for guests, while loading, or with no threads.
 */
export function useLastOracleThread(): OracleThreadLike | null {
  const session = useAuthSession()
  const oracle = useSafeOracle()
  const [localThreads, setLocalThreads] = useState<OracleThreadLike[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  const userId = session.userId
  const canLoadThreads = Boolean(userId) && !session.isGuest && !session.isPending

  const threads = oracle ? oracle.threads : localThreads
  const isLoadingThreads = oracle ? oracle.isLoadingThreads : localLoading

  useEffect(() => {
    if (oracle || !canLoadThreads || !userId) return

    let isMounted = true
    setLocalLoading(true)
    oracleAuthData(userId)
      .then((auth) => getAIThreadsFn({ data: auth }))
      .then((data) => {
        if (isMounted && Array.isArray(data)) setLocalThreads(data)
      })
      .catch(() => {
        if (isMounted) setLocalThreads([])
      })
      .finally(() => {
        if (isMounted) setLocalLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [oracle, canLoadThreads, userId])

  if (!canLoadThreads || isLoadingThreads) return null
  return pickLastActiveOracleThread(threads) ?? null
}
