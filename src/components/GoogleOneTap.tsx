import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { getPublicGoogleClientId } from '@/lib/auth-config'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import {
  ONE_TAP_DELAY_MS,
  clearOneTapSignedOut,
  hasShownOneTapThisVisit,
  isFreshAccount,
  isOneTapAutoPath,
  isOneTapHost,
  isOneTapQuizPath,
  markOneTapShownThisVisit,
  oneTapAutoSelectAllowed,
  onOneTapRequest,
} from '@/lib/one-tap'

type OneTapContext = 'signin' | 'signup'
type OneTapUser = { name?: string | null; createdAt?: unknown }
type ToastApi = NonNullable<ReturnType<typeof useOptionalToast>>['toast']

export const ONE_TAP_COPY = {
  welcome: 'Welcome to Moltology. Your account is ready.',
  signedIn: (name?: string | null) => (name ? `Signed in as ${name}.` : 'Signed in with Google.'),
  notLinked: 'That email already has a password account. Sign in with your password, then link Google in Settings.',
  failed: 'Google sign-in did not go through. Try the Sign in button instead.',
} as const

function readOneTapUser(data: unknown): OneTapUser | null {
  if (!data || typeof data !== 'object' || !('user' in data)) return null
  return (data as { user?: OneTapUser }).user ?? null
}

function errorCopy(message: unknown): string {
  const text = typeof message === 'string' ? message.toLowerCase() : ''
  return text.includes('not linked') || text.includes('not_linked') ? ONE_TAP_COPY.notLinked : ONE_TAP_COPY.failed
}

function cancelOpenPrompt(): void {
  try {
    window.google?.accounts?.id?.cancel?.()
  } catch {
    // Script not loaded; nothing to close.
  }
}

/**
 * Google One Tap ("Sign in as …" card, top right). Shows once per visit to
 * signed-out visitors on public pages, and on request after a quiz result.
 * Returning Google members are signed in without a click unless they signed
 * out on this browser.
 */
export function GoogleOneTap() {
  const session = useAuthSession()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const toast = useOptionalToast()?.toast
  const toastRef = useRef(toast)
  toastRef.current = toast
  const clientId = getPublicGoogleClientId()
  const isGuest = session.isGuest && !session.isPending
  const enabled = Boolean(clientId) && typeof window !== 'undefined' && isOneTapHost(window.location.hostname)
  const canPromptRef = useRef(false)
  canPromptRef.current = enabled && isGuest
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  useEffect(() => {
    if (!enabled) return
    return onOneTapRequest(({ context }) => {
      if (!canPromptRef.current) return
      void runOneTap(context, toastRef)
    })
  }, [enabled])

  useEffect(() => {
    if (!enabled || !isGuest || !isOneTapAutoPath(pathname) || hasShownOneTapThisVisit()) return
    const timer = window.setTimeout(() => {
      if (!canPromptRef.current || !isOneTapAutoPath(pathRef.current)) return
      markOneTapShownThisVisit()
      void runOneTap('signin', toastRef)
    }, ONE_TAP_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [enabled, isGuest, pathname])

  // Close an open card when the visitor moves into the app or signs in another way.
  useEffect(() => {
    if (!enabled) return
    if (!isGuest || (!isOneTapAutoPath(pathname) && !isOneTapQuizPath(pathname))) cancelOpenPrompt()
  }, [enabled, isGuest, pathname])

  return null
}

async function runOneTap(
  context: OneTapContext,
  toastRef: { current: ToastApi | undefined },
): Promise<void> {
  try {
    await authClient.oneTap({
      context,
      autoSelect: oneTapAutoSelectAllowed(),
      fetchOptions: {
        onSuccess: ({ data }) => {
          clearOneTapSignedOut()
          authClient.$store.notify('$sessionSignal')
          const user = readOneTapUser(data)
          if (isFreshAccount(user?.createdAt)) {
            toastRef.current?.success(ONE_TAP_COPY.welcome, {
              id: 'one-tap',
              action: { label: 'Get started', href: '/dashboard' },
            })
          } else {
            toastRef.current?.success(ONE_TAP_COPY.signedIn(user?.name), {
              id: 'one-tap',
              action: { label: 'Dashboard', href: '/dashboard' },
            })
          }
        },
        onError: ({ error }) => {
          toastRef.current?.error(errorCopy(error?.message), { id: 'one-tap' })
        },
      },
    })
  } catch (err) {
    // Script blocked (ad blocker, offline). The normal sign-in buttons still work.
    console.warn('[one-tap] Prompt unavailable:', err instanceof Error ? err.message : err)
  }
}
