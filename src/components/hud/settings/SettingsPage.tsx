import React, { useEffect, useRef, useState } from 'react'
import { Mail, Radio } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { HudSwitch } from '@/components/ui/HudSwitch'
import { HubSurfaceControls } from '@/components/hud/HubSurfaceControls'
import { getAuthJWTToken } from '@/lib/jwt'
import { claimMemberHandleFn, updateEmailPreferencesFn } from '@/lib/server/api'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { accountKeys, useAppQueryClient } from '@/lib/query/account'
import { parseMemberHandle } from '@/lib/member-handle'
import { DesignationField } from '../DesignationField'
import { useHudPersist } from '@/hooks/useHudPersist'
import { ConnectedAccounts } from './ConnectedAccounts'
import { PlanUsageSection } from '@/components/ai/OracleUsage'
import { PremiumSettingsSection } from './PremiumSettingsSection'
import { OracleChatSettingsForm } from '@/components/ai/OracleChatSettings'
import { SettingsCard, SettingsRow, SettingsRows } from './settings-ui'

export const SettingsPage: React.FC<{ oauthError?: string }> = ({ oauthError }) => {
  const session = useAuthSession()
  const userId = session.userId
  const persist = useHudPersist()
  const { toast } = useToast()

  const [emailOptIn, setEmailOptIn] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [designation, setDesignation] = useState('')
  const [savedDesignation, setSavedDesignation] = useState('')
  // Shared, cached profile: a returning member's settings show at once and refresh quietly.
  const { profile, isLoading: profileLoading } = useAccountProfile(userId)
  const loading = session.isPending || profileLoading
  const seededFor = useRef<unknown>(null)
  const queryClient = useAppQueryClient()

  useEffect(() => {
    // Copy each new server reading into the form, unless the member is mid-edit.
    if (profile === undefined || seededFor.current === profile) return
    seededFor.current = profile
    if (profile && typeof profile.emailOptIn === 'boolean' && !emailSaving) {
      setEmailOptIn(profile.emailOptIn)
    }
    const nextHandle = profile?.handle?.trim() || ''
    setDesignation((current) => (current === savedDesignation ? nextHandle : current))
    setSavedDesignation(nextHandle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const toggleEmailOptIn = async () => {
    if (!userId || emailSaving) return
    setEmailSaving(true)
    const nextState = !emailOptIn
    setEmailOptIn(nextState)
    try {
      await persist.run('settings-email', async () => {
        const token = await getAuthJWTToken()
        const result = await updateEmailPreferencesFn({
          data: {
            emailOptIn: nextState,
            source: 'settings_page',
            userId,
            token: token ?? undefined,
          },
        })
        setEmailOptIn(result.emailOptIn)
        void queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId) })
        if (result.confirmationPending) toast.info('Check your email to confirm your subscription.')
      })
    } catch {
      setEmailOptIn(!nextState)
      toast.error('Could not update email preferences. Please try again.')
    } finally {
      setEmailSaving(false)
    }
  }

  const handleSaveDesignation = async () => {
    if (!userId) return
    const parsed = parseMemberHandle(designation)
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    try {
      await persist.run('settings-designation', async () => {
        const token = await getAuthJWTToken()
        await claimMemberHandleFn({
          data: { handle: parsed.handle, userId, token: token ?? undefined },
        })
      })
      setSavedDesignation(parsed.handle)
      setDesignation(parsed.handle)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('member-handle-changed'))
      }
      toast.success('Username saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save username. Please try again.')
    }
  }

  const handleRestartWelcome = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('launch-welcome-splash'))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative">
        <HudTitlePanel treatment="band" title="Settings" />
        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3 sm:gap-4 lg:gap-5">
          <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset animate-pulse motion-reduce:animate-none h-64" />
          <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset animate-pulse motion-reduce:animate-none h-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative">
      <HudTitlePanel treatment="band" title="Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3 sm:gap-4 lg:gap-5">
        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          <SettingsCard
            title="Account"
            description="Your username is your public name in the forum and member lists."
          >
            <SettingsRows>
              <div className="space-y-2.5">
                <DesignationField value={designation} onChange={setDesignation} />
                <HudButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleSaveDesignation}
                  disabled={!parseMemberHandle(designation).ok || designation === savedDesignation}
                >
                  Save username
                </HudButton>
              </div>
              <ConnectedAccounts oauthError={oauthError} />
            </SettingsRows>
          </SettingsCard>

          <SettingsCard title="Notifications">
            <SettingsRows>
              <SettingsRow
                icon={<Mail />}
                label="Email updates"
                status={emailOptIn ? 'Subscribed to news and updates' : 'Not subscribed'}
                control={
                  <HudSwitch
                    checked={emailOptIn}
                    onChange={() => void toggleEmailOptIn()}
                    disabled={emailSaving}
                    aria-label="Toggle email updates"
                  />
                }
              />
              <HubSurfaceControls />
            </SettingsRows>
          </SettingsCard>
        </div>

        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          <SettingsCard title="Oracle" description="Personality and custom instructions for every chat.">
            <OracleChatSettingsForm />
          </SettingsCard>
          <PlanUsageSection userId={userId} />
          <PremiumSettingsSection />
          <SettingsCard title="Help">
            <SettingsRow
              icon={<Radio />}
              label="Welcome tour"
              status="Walk through the welcome guide again"
              control={
                <HudButton type="button" variant="secondary" size="sm" onClick={handleRestartWelcome}>
                  Replay
                </HudButton>
              }
            />
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}
