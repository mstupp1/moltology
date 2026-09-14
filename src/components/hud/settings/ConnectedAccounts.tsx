import React, { useCallback, useEffect, useState } from 'react'
import { KeyRound, Link2, Unlink } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
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


  return (
    <div className="chitin-card-inset p-3 sm:p-4 space-y-3 rounded-sm">
      <div>
        <h3 className="text-sm font-grotesk font-bold text-[#dfe3e3]">Sign-in methods</h3>
        <p className="text-xs text-[#839493] font-sans mt-0.5">
          Use Google or email and password to sign in to this account.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <KeyRound className="w-5 h-5 shrink-0 text-[#00c3ff]" />
            <div className="min-w-0">
              <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">Email and password</span>
              <span className="text-xs text-[#839493] font-sans">
                {accounts === null
                  ? 'Loading…'
                  : emailConnected
                    ? showVerification
                      ? emailVerified
                        ? EMAIL_VERIFICATION_COPY.settingsVerified
                        : EMAIL_VERIFICATION_COPY.settingsUnverified
                      : 'Connected'
                    : 'Not connected'}
              </span>
            </div>
          </div>
          {showVerification && !emailVerified ? (
            <button
              type="button"
              onClick={() => void handleResendVerification()}
              disabled={resendBusy || busy !== null}
              aria-label="Resend confirmation"
              className="px-3 py-1.5 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-[11px] uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendBusy ? 'Sending…' : EMAIL_VERIFICATION_COPY.resend}
            </button>
          ) : null}
        </div>

        {googleEnabled ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link2 className="w-5 h-5 shrink-0 text-[#00c3ff]" />
              <div className="min-w-0">
                <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">Google</span>
                <span className="text-xs text-[#839493] font-sans">
                  {accounts === null ? 'Loading…' : googleConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
            {googleConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                disabled={busy !== null || !canDisconnectGoogle}
                aria-label="Disconnect Google"
                className="px-3 py-1.5 border border-[#3a4a49] hover:border-[#ff453a]/60 text-[#dfe3e3] font-grotesk font-bold text-[11px] uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={busy !== null || accounts === null}
                aria-label="Connect Google"
                className="px-3 py-1.5 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-[11px] uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Connect Google
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
