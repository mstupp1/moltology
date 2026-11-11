import { useEffect, useState } from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import type { WalletBalances } from '@/lib/market'
import { getWalletBalancesFn } from '@/lib/server/api'

/**
 * Gem and credit balances for the avatar menu. Loads whenever `userId` is set (the menu
 * passes it only while open), so a purchase elsewhere shows the next time it opens.
 */
export function useWalletBalances(userId: string | null | undefined): WalletBalances | null {
  const [balances, setBalances] = useState<WalletBalances | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const token = await getAuthJWTToken()
        const next = await getWalletBalancesFn({ data: { token: token ?? undefined } })
        if (!cancelled && next) {
          setBalances(next)
          setOwnerId(userId)
        }
      } catch {
        // Keep the last reading; the row is a glance, the shop is the source of truth.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Never show one member's balances to another after an account switch.
  return userId && ownerId !== null && ownerId !== userId ? null : balances
}
