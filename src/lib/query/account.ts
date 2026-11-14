import { useContext, useEffect } from 'react'
import {
  QueryClientContext,
  useQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { getAuthJWTToken } from '@/lib/jwt'
import { getQueryClient } from './client'

/**
 * Member-scoped queries. Every key starts with `['account', userId]` so sign-out can
 * drop them all at once and an account switch never reuses the last member's data.
 *
 * Add a member's own data here (or next to its feature with an `accountKeys` key)
 * instead of fetching it in a component `useEffect`. See AGENTS.md "Loading account data".
 */
export const accountKeys = {
  all: ['account'] as const,
  member: (userId: string) => ['account', userId] as const,
  profile: (userId: string) => ['account', userId, 'profile'] as const,
  wallet: (userId: string) => ['account', userId, 'wallet'] as const,
  premium: (userId: string) => ['account', userId, 'premium'] as const,
  forumStanding: (userId: string) => ['account', userId, 'forum-standing'] as const,
  friendRequests: (userId: string) => ['account', userId, 'friend-requests'] as const,
  /** Friends, incoming and sent. `variant` separates the page's paged read from the plain summary. */
  connections: (userId: string, variant: string = 'summary') => ['account', userId, 'connections', variant] as const,
  activity: (userId: string, params: Record<string, unknown>) => ['account', userId, 'activity', params] as const,
  market: (userId: string | null) => ['account', userId ?? 'guest', 'market'] as const,
  /** Oracle skills with this member's access, plus the auto-pick setting. Guests get the catalog. */
  oracleSkills: (userId: string | null) => ['account', userId ?? 'guest', 'oracle-skills'] as const,
  /** Another member's profile page as this member sees it. */
  memberProfile: (userId: string | null, profileParam: string) =>
    ['account', userId ?? 'guest', 'member-profile', profileParam] as const,
}

/** After a friend request, accept, cancel or removal: every friends list and member page reloads. */
export function invalidateConnections(client: QueryClient): Promise<void> {
  return client.invalidateQueries({
    predicate: (query) => {
      const part = query.queryKey[2]
      return query.queryKey[0] === 'account' && (part === 'connections' || part === 'member-profile' || part === 'friend-requests')
    },
  })
}

/** Server functions take the member's JWT in `data.token`; resolve it once per read. */
export async function authToken(): Promise<string | undefined> {
  return (await getAuthJWTToken().catch(() => null)) ?? undefined
}

/**
 * The provider's client inside the app, or the tab's shared client where a component
 * renders without the router (unit tests, isolated previews).
 */
export function useAppQueryClient(): QueryClient {
  return useContext(QueryClientContext) ?? getQueryClient()
}

/** `useQuery` bound to the app client, so hooks work with or without the provider. */
export function useAppQuery<TData>(
  options: UseQueryOptions<TData, Error, TData, readonly unknown[]>,
): UseQueryResult<TData, Error> {
  return useQuery(options, useAppQueryClient())
}

/** Window events other parts of the app already fire when member data changes. */
export const PROFILE_CHANGE_EVENTS = ['profile-avatar-changed', 'member-handle-changed', 'experiments-changed'] as const

/**
 * Refetches `queryKey` once whenever one of `events` fires on window. Several mounted
 * readers share the one in-flight request (`cancelRefetch: false`).
 */
export function useRefetchOnWindowEvents(
  queryKey: readonly unknown[] | null,
  events: readonly string[],
): void {
  const client = useAppQueryClient()
  const keyHash = queryKey ? JSON.stringify(queryKey) : null
  useEffect(() => {
    if (!queryKey) return
    const refresh = () => {
      void client.invalidateQueries({ queryKey, exact: true }, { cancelRefetch: false })
    }
    for (const name of events) window.addEventListener(name, refresh)
    return () => {
      for (const name of events) window.removeEventListener(name, refresh)
    }
    // keyHash stands in for the array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, keyHash, events])
}
