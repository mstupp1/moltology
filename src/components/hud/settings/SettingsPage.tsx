import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, Radio, Settings, Shuffle } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
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
  parseLobsterAvatarConfig,
  randomLobsterSeed,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { LobsterAvatarPortrait } from '../LobsterAvatarPortrait'

export const SettingsPage: React.FC = () => {
  const session = useAuthSession()
  const user = session.user
  const userId = session.userId
  const persist = useHudPersist()
  const { toast } = useToast()

  const [emailOptIn, setEmailOptIn] = useState(false)
  const [draftSeed, setDraftSeed] = useState('')
  const [designation, setDesignation] = useState('')
  const [savedDesignation, setSavedDesignation] = useState('')
  const [loading, setLoading] = useState(true)

  const draftConfig = useMemo((): LobsterAvatarConfig => {
    return {
      style: LOBSTER_AVATAR_STYLE,
      seed: draftSeed,
    }
  }, [draftSeed])

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
      setDraftSeed(parsed?.seed ?? randomLobsterSeed())
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

  const handleRandomize = () => {
    setDraftSeed(randomLobsterSeed())
  }

  const handleSaveAvatar = async () => {
    if (!userId || !draftSeed.trim()) return
    const config: LobsterAvatarConfig = {
      style: LOBSTER_AVATAR_STYLE,
      seed: draftSeed.trim(),
    }
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
        <div className="chitin-card p-5 chamfer-corner shadow-2xl animate-pulse h-32" />
        <div className="chitin-card p-5 chamfer-corner shadow-2xl animate-pulse h-64" />
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
        description="Choose your avatar, email preferences, and command surface options."
      />

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left: Avatar */}
          <div className="space-y-4">
            <div>
              <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                Avatar
              </h2>
              <p className="text-xs text-[#839493] font-sans mt-0.5">
                Shows on your chassis page when saved.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <LobsterAvatarPortrait
                config={draftConfig}
                size={320}
                interactive
                alt="Avatar preview"
              />

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="px-4 py-2 border border-[#3a4a49] hover:border-[#00c3ff]/50 text-[#00c3ff] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors inline-flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Randomize
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={!draftSeed.trim()}
                  className="px-4 py-2 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Avatar
                </button>
              </div>
            </div>
          </div>

          {/* Right: Preferences */}
          <div className="space-y-4">
            <div>
              <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                Preferences
              </h2>
              <p className="text-xs text-[#839493] font-sans mt-0.5">
                Communication and onboarding options.
              </p>
            </div>

            <div className="space-y-3">
              <div className="chitin-card-inset p-3 sm:p-4 space-y-3 rounded-sm">
                <div>
                  <h3 className="text-sm font-grotesk font-bold text-[#dfe3e3]">Designation</h3>
                  <p className="text-xs text-[#839493] font-sans mt-0.5">
                    Your public name on the hub and forum. Your larva unit stays on file.
                  </p>
                </div>
                <DesignationField value={designation} onChange={setDesignation} />
                <button
                  type="button"
                  onClick={handleSaveDesignation}
                  disabled={!parseMemberHandle(designation).ok || designation === savedDesignation}
                  className="px-4 py-2 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Seal designation
                </button>
              </div>

              <div className="chitin-card-inset p-3 sm:p-4 flex items-center justify-between gap-3 rounded-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 shrink-0 text-[#00c3ff]" />
                  <div className="min-w-0">
                    <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">
                      Email Updates
                    </span>
                    <span className="text-xs text-[#839493] font-sans">
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#00c3ff] ${
                    emailOptIn ? 'bg-[#00c3ff]' : 'bg-cyan-950 border-cyan-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      emailOptIn ? 'translate-x-5' : 'translate-x-0 bg-slate-300'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleRestartWelcome}
                className="w-full chitin-card-inset p-3 sm:p-4 flex items-center gap-3 rounded-sm text-left hover:bg-white/[0.03] transition-colors group"
              >
                <Radio className="w-5 h-5 shrink-0 text-[#00c3ff] group-hover:text-[#00ffff] transition-colors" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">
                    Replay Initiation Broadcast
                  </span>
                  <span className="text-xs text-[#839493] font-sans">
                    Restart the welcome guide from the beginning
                  </span>
                </div>
              </button>

              <div className="pt-2 border-t border-[#3a4a49]/60 space-y-2">
                <div>
                  <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wider uppercase">
                    Command Surface
                  </h3>
                  <p className="text-xs text-[#839493] font-sans mt-0.5">
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
