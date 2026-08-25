import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export interface HudPersistContextValue {
  isPersisting: boolean
  begin: (key: string) => void
  end: (key: string) => void
  run: <T>(key: string, work: () => Promise<T>) => Promise<T>
}

const HudPersistContext = createContext<HudPersistContextValue | null>(null)

const NOOP_PERSIST: HudPersistContextValue = {
  isPersisting: false,
  begin: () => {},
  end: () => {},
  run: async (_key, work) => work(),
}

export function HudPersistProvider({ children }: { children: React.ReactNode }) {
  const [activeKeys, setActiveKeys] = useState<Map<string, number>>(() => new Map())

  const begin = useCallback((key: string) => {
    setActiveKeys((prev) => {
      const next = new Map(prev)
      next.set(key, (next.get(key) ?? 0) + 1)
      return next
    })
  }, [])

  const end = useCallback((key: string) => {
    setActiveKeys((prev) => {
      const current = prev.get(key) ?? 0
      if (current <= 0) return prev
      const next = new Map(prev)
      if (current === 1) {
        next.delete(key)
      } else {
        next.set(key, current - 1)
      }
      return next
    })
  }, [])

  const run = useCallback(
    async <T,>(key: string, work: () => Promise<T>): Promise<T> => {
      begin(key)
      try {
        return await work()
      } finally {
        end(key)
      }
    },
    [begin, end]
  )

  const isPersisting = activeKeys.size > 0

  const value = useMemo<HudPersistContextValue>(
    () => ({
      isPersisting,
      begin,
      end,
      run,
    }),
    [isPersisting, begin, end, run]
  )

  return (
    <HudPersistContext.Provider value={value}>
      {children}
    </HudPersistContext.Provider>
  )
}

/**
 * Shell-level persist bus for optimistic HUD saves.
 * Outside a provider, returns no-ops so unit tests and standalone mounts stay safe.
 */
export function useHudPersist(): HudPersistContextValue {
  return useContext(HudPersistContext) ?? NOOP_PERSIST
}
