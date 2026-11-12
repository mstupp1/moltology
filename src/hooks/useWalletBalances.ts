import type { WalletBalances } from '@/lib/market'
import { getWalletBalancesFn } from '@/lib/server/api'
import { accountKeys, authToken, useAppQuery } from '@/lib/query/account'

/**
 * Gem and credit balances for the avatar menu. Reads whenever `userId` is set (the menu
 * passes it only while open) and refreshes in the background each time it opens, while
 * the last known balances show straight away.
 */
export function useWalletBalances(userId: string | null | undefined): WalletBalances | null {
  const query = useAppQuery<WalletBalances | null>({
    queryKey: userId ? accountKeys.wallet(userId) : ['account', null, 'wallet'],
    queryFn: async () => (await getWalletBalancesFn({ data: { token: await authToken() } })) ?? null,
    enabled: Boolean(userId),
    staleTime: 0,
    meta: { persist: true },
  })
  return userId ? (query.data ?? null) : null
}
