import React, { useCallback, useEffect, useState } from 'react'
import { KeyRound, Link2, Unlink } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
import { authClient } from '@/lib/auth-client'
import { isEmailVerificationEnabled, isGoogleAuthEnabled } from '@/lib/auth-config'
import { EMAIL_VERIFICATION_COPY } from '@/lib/auth-email-verification'
import { useAuthSession } from '@/hooks/useAuthSession'
import {
  canUnlinkProvider,
  CREDENTIAL_PROVIDER_ID,
  GOOGLE_PROVIDER_ID,
  hasProvider,
  type LinkedAccount,
} from '@/lib/auth-accounts'
import { mapOAuthLinkError } from '@/lib/auth-oauth-errors'
import { SettingsRow, SettingsRows } from './settings-ui'

export function ConnectedAccounts({ oauthError }: { oauthError?: string }) {
  const { toast } = useToast()
  const googleEnabled = isGoogleAuthEnabled()
  const emailVerificationEnabled = isEmailVerificationEnabled()
  const { user } = useAuthSession()
  const [resendBusy, setResendBusy] = useState(false)
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null)
  const [busy, setBusy] = useState<'link' | 'unlink' | null>(null)

  const loadAccounts = useCallback(async () => {
    const { data, error } = await authClient.listAccounts()
    if (error) {
      toast.error('Could not load sign-in methods.')
      setAccounts([])
      return
    }
    setAccounts((data ?? []) as LinkedAccount[])
  }, [toast])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    if (!oauthError) return
    toast.error(mapOAuthLinkError(oauthError), { id: 'settings-google-link' })
  }, [oauthError, toast])

  const googleConnected = hasProvider(accounts ?? [], GOOGLE_PROVIDER_ID)
  const emailConnected = hasProvider(accounts ?? [], CREDENTIAL_PROVIDER_ID)
  const canDisconnectGoogle = canUnlinkProvider(accounts ?? [], GOOGLE_PROVIDER_ID)

  const handleConnectGoogle = async () => {
    if (typeof window === 'undefined') return
    setBusy('link')
    try {
      const origin = window.location.origin
      const { error } = await authClient.linkSocial({
        provider: 'google',
        callbackURL: `${origin}/settings`,
        errorCallbackURL: `${origin}/settings`,
      })
      if (error) {
        toast.error(error.message || 'Could not connect Google.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect Google.')
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!canDisconnectGoogle) {
      toast.warning('Keep at least one sign-in method.')
      return
    }
    setBusy('unlink')
    const googleAccount = (accounts ?? []).find((account) => account.providerId === GOOGLE_PROVIDER_ID)
    if (!googleAccount?.id) {
      setBusy(null)
      toast.error('Could not disconnect Google.')
      return
    }
    try {
      const { error } = await authClient.unlinkAccount({
        accountId: googleAccount.id,
      })
      if (error) {
        toast.error(error.message || 'Could not disconnect Google.')
        return
      }
      toast.success('Google disconnected.')
      await loadAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not disconnect Google.')
    } finally {
      setBusy(null)
    }
  }

  const emailVerified = user?.emailVerified === true
  const showVerification = emailVerificationEnabled && emailConnected

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('Could not resend confirmation.')
      return
    }
    setResendBusy(true)
    try {
      const callbackURL =
        typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard'
      const { error } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL,
      })
      if (error) {
        toast.error(error.message || 'Could not resend confirmation.')
        return
      }
      toast.success(EMAIL_VERIFICATION_COPY.resendSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend confirmation.')
    } finally {
      setResendBusy(false)
    }
  }


  const emailStatus =
    accounts === null
      ? 'Loading…'
      : emailConnected
        ? showVerification
          ? emailVerified
            ? EMAIL_VERIFICATION_COPY.settingsVerified
            : EMAIL_VERIFICATION_COPY.settingsUnverified
          : 'Connected'
        : 'Not connected'

  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-xs font-grotesk font-bold text-ink-body">Sign-in methods</h3>
        <p className="text-xs text-ink-muted font-sans mt-0.5">
          Use Google or email and password to sign in to this account.
        </p>
      </div>

      <SettingsRows>
        <SettingsRow
          icon={<KeyRound />}
          label="Email and password"
          status={emailStatus}
          control={
            showVerification && !emailVerified ? (
              <HudButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleResendVerification()}
                disabled={resendBusy || busy !== null}
                aria-label="Resend confirmation"
              >
                {resendBusy ? 'Sending…' : EMAIL_VERIFICATION_COPY.resend}
              </HudButton>
            ) : null
          }
        />

        {googleEnabled ? (
          <SettingsRow
            icon={<Link2 />}
            label="Google"
            status={accounts === null ? 'Loading…' : googleConnected ? 'Connected' : 'Not connected'}
            control={
              googleConnected ? (
                <HudButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  disabled={busy !== null || !canDisconnectGoogle}
                  aria-label="Disconnect Google"
                  icon={<Unlink className="w-3.5 h-3.5" />}
                >
                  Disconnect
                </HudButton>
              ) : (
                <HudButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={busy !== null || accounts === null}
                  aria-label="Connect Google"
                >
                  Connect Google
                </HudButton>
              )
            }
          />
        ) : null}
      </SettingsRows>
    </div>
  )
}
