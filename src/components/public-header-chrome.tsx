import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

export interface PublicHeaderChromeState {
  height: number
  visible: boolean
}

interface PublicHeaderChromeContextValue extends PublicHeaderChromeState {
  register: (next: PublicHeaderChromeState) => void
}

const PublicHeaderChromeContext = createContext<PublicHeaderChromeContextValue | null>(null)

const HIDDEN_CHROME: PublicHeaderChromeState = { height: 0, visible: true }

export function PublicHeaderChromeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PublicHeaderChromeState>(HIDDEN_CHROME)

  const register = useCallback((next: PublicHeaderChromeState) => {
    setState((prev) =>
      prev.height === next.height && prev.visible === next.visible ? prev : next,
    )
  }, [])

  const value = useMemo(
    () => ({ height: state.height, visible: state.visible, register }),
    [state.height, state.visible, register],
  )

  return (
    <PublicHeaderChromeContext.Provider value={value}>
      {children}
    </PublicHeaderChromeContext.Provider>
  )
}

/** Reads the live header offset. Outside a provider, the header is treated as not reserving space. */
export function usePublicHeaderChrome(): PublicHeaderChromeState {
  const ctx = useContext(PublicHeaderChromeContext)
  return ctx ?? HIDDEN_CHROME
}

/** Publishes header size and visibility. No-ops when the header is not inside a chrome provider. */
export function useRegisterPublicHeaderChrome(next: PublicHeaderChromeState) {
  const ctx = useContext(PublicHeaderChromeContext)

  useLayoutEffect(() => {
    ctx?.register(next)
  }, [ctx, next.height, next.visible])
}
