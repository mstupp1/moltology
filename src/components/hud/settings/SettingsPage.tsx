import React, { useCallback, useEffect, useState } from 'react'
import { EyeOff, Mail, Radio, Settings, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudButton } from '@/components/ui/HudButton'
import { HubSurfaceControls } from '@/components/hud/HubSurfaceControls'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  claimMemberHandleFn,
  getUserProfileFn,
  saveLobsterAvatarFn,
  updateEmailPreferencesFn,
} from '@/lib/server/api'
import { parseMemberHandle } from '@/lib/member-handle'
import { DesignationField } from '../DesignationField'
import { useHudPersist } from '@/hooks/useHudPersist'
import {
  LOBSTER_AVATAR_STYLE,
  clearCachedProfileAvatarUrl,
  lockAvatarConfig,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { AvatarCreatorPanel } from '../avatar/AvatarCreatorPanel'
import { AvatarCreatorPreview } from '../avatar/AvatarCreatorPreview'
import { ConnectedAccounts } from './ConnectedAccounts'
import { PremiumSettingsSection } from './PremiumSettingsSection'

export const SettingsPage: React.FC<{ oauthError?: string }> = ({ oauthError }) => {
  const session = useAuthSession()
  const userId = session.userId
  const persist = useHudPersist()
  const { toast } = useToast()
  const { heavyVfxDisabled, toggleHeavyVfx } = useHeavyVfx()

  const [emailOptIn, setEmailOptIn] = useState(false)
  const [draftConfig, setDraftConfig] = useState<LobsterAvatarConfig | null>(null)
  const [designation, setDesignation] = useState('')
  const [savedDesignation, setSavedDesignation] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const token = await getAuthJWTToken()
      const profile = await getUserProfileFn({
        data: { userId, token: token ?? undefined },
      })
      if (profile && typeof profile.emailOptIn === 'boolean') {
        setEmailOptIn(profile.emailOptIn)
      }
      const nextHandle = profile?.handle?.trim() || ''
      setDesignation(nextHandle)
      setSavedDesignation(nextHandle)
      const parsed = parseLobsterAvatarConfig(profile?.avatarConfig)
      setDraftConfig(parsed ?? { style: LOBSTER_AVATAR_STYLE, seed: randomLobsterSeed() })
    } catch {
      toast.error('Could not load settings.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const toggleEmailOptIn = async () => {
    if (!userId) return
    const nextState = !emailOptIn
    setEmailOptIn(nextState)
    try {
      await persist.run('settings-email', async () => {
        const token = await getAuthJWTToken()
        await updateEmailPreferencesFn({
          data: {
            emailOptIn: nextState,
            source: 'settings_page',
            userId,
            token: token ?? undefined,
          },
        })
      })
    } catch {
      setEmailOptIn(!nextState)
      toast.error('Could not update email preferences.')
    }
  }

  const handleSaveAvatar = async () => {
    if (!userId || !draftConfig?.seed.trim()) return
    const config = lockAvatarConfig(draftConfig)
    try {
      await persist.run('settings-avatar', async () => {
        const token = await getAuthJWTToken()
        await saveLobsterAvatarFn({
          data: { ...config, userId, token: token ?? undefined },
        })
        clearCachedProfileAvatarUrl(userId)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
        }
      })
      toast.success('Avatar saved.')
    } catch {
      toast.error('Could not save avatar.')
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
      <div className="space-y-3.5 sm:space-y-5 font-sans relative">
        <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-5 animate-pulse h-32" />
        <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-5 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <HudTitlePanel
        accent="teal"
        eyebrow={
          <>
            <Settings className="w-3.5 h-3.5" />
            Account
          </>
        }
        title="Settings"
        description="Choose your avatar, email preferences, sign-in methods, display ambience, command surface options, and Premium membership."
      />

      <PremiumSettingsSection />

      <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-3 sm:p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left: Avatar */}
          <div className="space-y-4">
            <div>
              <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">
                Avatar
              </h2>
              <p className="text-xs text-ink-muted font-sans mt-0.5">
                Build your character. It shows on your chassis page, in the forum, and across the HUD once saved.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {draftConfig ? (
                <>
                  <AvatarCreatorPreview config={draftConfig} className="max-w-[280px]" />
                  <AvatarCreatorPanel value={draftConfig} onChange={setDraftConfig} disabled={loading} />
                </>
              ) : null}

              <HudButton
                type="button"
                variant="secondary"
                size="md"
                onClick={handleSaveAvatar}
                disabled={!draftConfig?.seed.trim()}
              >
                Save Avatar
              </HudButton>
            </div>
          </div>

          {/* Right: Preferences */}
          <div className="space-y-4">
            <div>
              <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">
                Preferences
              </h2>
              <p className="text-xs text-ink-muted font-sans mt-0.5">
                Communication, sign-in methods, display, and onboarding options.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-card border border-line-subtle bg-abyss/50 p-3 sm:p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-grotesk font-bold text-ink">Designation</h3>
                  <p className="text-xs text-ink-muted font-sans mt-0.5">
                    Your public name on the hub and forum. Your larva unit stays on file.
                  </p>
                </div>
                <DesignationField value={designation} onChange={setDesignation} />
                <HudButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleSaveDesignation}
                  disabled={!parseMemberHandle(designation).ok || designation === savedDesignation}
                >
                  Seal designation
                </HudButton>
              </div>

              <ConnectedAccounts oauthError={oauthError} />

              <div className="rounded-card border border-line-subtle bg-abyss/50 p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 shrink-0 text-cyan-glow" />
                  <div className="min-w-0">
                    <span className="text-sm font-grotesk font-bold text-ink block">
                      Email Updates
                    </span>
                    <span className="text-xs text-ink-muted font-sans">
                      {emailOptIn ? 'Subscribed to news and updates' : 'Not subscribed'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailOptIn}
                  aria-label="Toggle email updates"
                  onClick={toggleEmailOptIn}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    emailOptIn ? 'bg-cyan-glow border-transparent' : 'bg-surface-3 border-line'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                      emailOptIn ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-ink-muted'
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-card border border-line-subtle bg-abyss/50 p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {heavyVfxDisabled ? (
                    <EyeOff className="w-5 h-5 shrink-0 text-amber-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 shrink-0 text-cyan-glow" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-grotesk font-bold text-ink block">
                      Underwater Bubbles
                    </span>
                    <span className="text-xs text-ink-muted font-sans">
                      {heavyVfxDisabled
                        ? 'Hidden — reduces motion and battery use'
                        : 'Visible across the hub'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!heavyVfxDisabled}
                  aria-label="Toggle underwater bubbles"
                  onClick={toggleHeavyVfx}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    !heavyVfxDisabled ? 'bg-cyan-glow border-transparent' : 'bg-surface-3 border-line'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                      !heavyVfxDisabled ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-ink-muted'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleRestartWelcome}
                className="w-full rounded-card border border-line-subtle bg-abyss/50 p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-surface-2 hover:border-line-hover transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <Radio className="w-5 h-5 shrink-0 text-cyan-glow group-hover:text-cyan-hover transition-colors" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-grotesk font-bold text-ink block">
                    Replay Initiation Broadcast
                  </span>
                  <span className="text-xs text-ink-muted font-sans">
                    Restart the welcome guide from the beginning
                  </span>
                </div>
              </button>

              <div className="pt-2 border-t border-line-subtle space-y-2">
                <div>
                  <h3 className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase">
                    Command Surface
                  </h3>
                  <p className="text-xs text-ink-muted font-sans mt-0.5">
                    Install the hub shell and arm surface alerts for Activity Center transmissions.
                  </p>
                </div>
                <HubSurfaceControls dense />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
