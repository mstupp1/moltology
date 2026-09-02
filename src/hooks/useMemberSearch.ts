import { useEffect, useState } from 'react'
import { getAuthJWTToken } from '@/lib/jwt'
import { searchMembersFn } from '@/lib/server/api'
import type { MemberSearchResult } from '@/lib/connections'
import {
  MEMBER_SEARCH_DEBOUNCE_MS,
  MEMBER_SEARCH_MIN_CHARS,
  rankMemberSearchResults,
  sanitizeMemberSearchQuery,
} from '@/lib/member-search'
import { useToast } from '@/components/ui/ToastProvider'

export function useMemberSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!enabled) {
      setResults([])
      setSearching(false)
      return
    }

    const q = sanitizeMemberSearchQuery(query)
    if (q.length < MEMBER_SEARCH_MIN_CHARS) {
      setResults([])
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const token = await getAuthJWTToken()
        const next = await searchMembersFn({ data: { query: q, token: token ?? undefined } })
        if (!cancelled) setResults(rankMemberSearchResults(q, next))
      } catch (err) {
        if (!cancelled) {
          setResults([])
          toast.error(err instanceof Error ? err.message : 'Search failed.')
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, MEMBER_SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, enabled, toast])

  return { results, searching }
}
