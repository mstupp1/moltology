import React, { useCallback, useEffect, useState } from 'react'
import { Mail, Settings, Shuffle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  clearLobsterAvatarFn,
  getUserProfileFn,
  saveLobsterAvatarFn,
  updateEmailPreferencesFn,
} from '@/lib/server/api'
import { useHudPersist } from '@/hooks/useHudPersist'
import {
  LOBSTER_AVATAR_STYLE,
  clearCachedProfileAvatarUrl,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { LobsterAvatarPreview } from './LobsterAvatarPreview'

export const SettingsPage: React.FC = () => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const persist = useHudPersist()

  const [emailOptIn, setEmailOptIn] = useState(false)
  const [savedConfig, setSavedConfig] = useState<LobsterAvatarConfig | null>(null)
  const [draftSeed, setDraftSeed] = useState('')
  const [loading, setLoading] = useState(true)

  const draftConfig: LobsterAvatarConfig = {
    style: LOBSTER_AVATAR_STYLE,
    seed: draftSeed || randomLobsterSeed(),
  }

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
      const parsed = parseLobsterAvatarConfig(profile?.avatarConfig)
      setSavedConfig(parsed)
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
    const config: LobsterAvatarConfig = { style: LOBSTER_AVATAR_STYLE, seed: draftSeed.trim() }
    try {
      await persist.run('settings-avatar', async () => {
        const token = await getAuthJWTToken()
        const res = await saveLobsterAvatarFn({
          data: { ...config, userId, token: token ?? undefined },
        })
        const parsed = parseLobsterAvatarConfig(res?.avatarConfig)
        setSavedConfig(parsed)
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

  const handleClearAvatar = async () => {
    if (!userId) return
    try {
      await persist.run('settings-avatar', async () => {
        const token = await getAuthJWTToken()
        await clearLobsterAvatarFn({ data: { userId, token: token ?? undefined } })
        setSavedConfig(null)
        setDraftSeed(randomLobsterSeed())
        clearCachedProfileAvatarUrl(userId)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
        }
      })
      toast.success('Avatar removed.')
    } catch {
      toast.error('Could not remove avatar.')
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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00c3ff] border border-[#3a4a49] p-3.5 sm:p-4 md:p-5 chamfer-corner shadow-2xl">
        <div className="space-y-1 max-w-2xl">
          <div className="text-[10px] text-[#00c3ff] font-sans tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Settings className="w-3.5 h-3.5 text-[#00c3ff]" />
            Account
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase">
            Settings
          </h1>
          <p className="text-xs text-[#839493] font-sans mt-0.5">
            Choose your avatar and email preferences.
          </p>
        </div>
      </div>

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-4">
        <div>
          <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
            Avatar
          </h2>
          <p className="text-xs text-[#839493] font-sans mt-0.5">
            Shows on your chassis page when saved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="relative w-48 sm:w-56 h-[320px] sm:h-[380px] p-4 sm:p-6 rounded-2xl border border-[#00c3ff]/30 bg-gradient-to-b from-[#071624]/90 via-[#030c14]/95 to-[#01050a] flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-[0_0_25px_rgba(0,195,255,0.08)]">
            {/* Subtle ambient spotlight behind character */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,195,255,0.12),transparent_70%)] pointer-events-none" />

            {/* Character Preview Layer with Character-Masked Scanlines */}
            <LobsterAvatarPreview
              config={draftConfig}
              size={320}
              maskRadial={false}
              containerClassName="relative z-10 w-full h-full flex items-center justify-center"
              className="w-full h-full object-contain"
              alt="Avatar preview"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
            {savedConfig && (
              <button
                type="button"
                onClick={handleClearAvatar}
                className="px-4 py-2 bg-[#ff5540]/10 hover:bg-[#ff5540]/20 border border-[#ff5540]/40 text-[#ff5540] font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl">
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
      </div>
    </div>
  )
}
