import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Users, Shield, Calendar } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { LoadoutStatsPanel } from '@/components/hud/chassis/LoadoutStatsPanel'
import { ReadOnlyPaperDoll } from './ReadOnlyPaperDoll'
import { FriendRequestButton } from './FriendRequestButton'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { getAuthJWTToken } from '@/lib/jwt'
import { getPublicProfileFn, getMemberLoadoutFn } from '@/lib/server/api'
import type { PublicProfileView } from '@/lib/connections'
import type { CatalogRef, GearItemState, LoadoutTotals } from '@/lib/chassis-loadout'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { resolveMemberDossierRedirect } from '@/lib/member-handle'

const STAT_ROWS: Array<{ key: keyof NonNullable<PublicProfileView['stats']>; label: string }> = [
  { key: 'pincerTorque', label: 'Pincer Torque' },
  { key: 'shellHardness', label: 'Shell Hardness' },
  { key: 'processingPower', label: 'Processing Power' },
  { key: 'durability', label: 'Durability' },
  { key: 'clawStrength', label: 'Claw Strength' },
  { key: 'socialDetachmentIndex', label: 'Social Detachment' },
  { key: 'submergenceDepthRating', label: 'Submergence Depth' },
]

export interface MemberProfilePageProps {
  profileId: string
  /** Public `/member/$profileId` only. `/profile` stays the signed-in self dossier. */
  canonicalizePath?: boolean
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  profileId,
  canonicalizePath = false,
}) => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfileView | null>(null)
  const [loadout, setLoadout] = useState<{
    catalog: CatalogRef[]
    items: GearItemState[]
    totals: LoadoutTotals
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const token = await getAuthJWTToken()
      const [nextProfile, nextLoadout] = await Promise.all([
        getPublicProfileFn({ data: { profileId, token: token ?? undefined } }),
        getMemberLoadoutFn({ data: { profileId, token: token ?? undefined } }),
      ])
      setProfile(nextProfile)
      setLoadout(nextLoadout)
      setError(nextProfile ? null : 'Member not found.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this profile.')
    } finally {
      setLoaded(true)
    }
  }, [profileId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!canonicalizePath || !profile) return
    const dest = resolveMemberDossierRedirect(profileId, profile)
    if (!dest) return
    void navigate({
      to: '/member/$profileId',
      params: { profileId: dest },
      replace: true,
    })
  }, [canonicalizePath, navigate, profile, profileId])

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogRef>()
    for (const item of loadout?.catalog ?? []) map.set(item.id, item)
    return map
  }, [loadout])

  if (!loaded) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Retrieving member dossier.</span>
        <HudWorkspaceGhost />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-3.5 sm:space-y-5 font-sans relative">
        <div className="chitin-card p-5 chamfer-corner border border-[#ff453a]/40 text-[#ff453a]">
          <h1 className="font-grotesk text-sm font-bold uppercase tracking-wider">Profile unavailable</h1>
          <p className="text-xs mt-2 text-[#839493]">{error || 'Member not found.'}</p>
          <Link to="/connections" className="inline-block mt-4 text-xs text-[#00c3ff] underline">
            Back to Connections
          </Link>
        </div>
      </div>
    )
  }

  const memberSinceLabel = new Date(profile.memberSince).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <div className="relative overflow-hidden rounded-sm border border-[#3a4a49] border-l-4 border-l-[#00c3ff] bg-gradient-to-br from-[#0a1214] via-[#071012] to-[#050808] p-4 sm:p-5 shadow-2xl chamfer-corner">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
          <LobsterAvatarPortrait
            config={(profile.avatarConfig as LobsterAvatarConfig | null) ?? null}
            className="w-28 h-28 sm:w-36 sm:h-36 shrink-0"
            size={256}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-grotesk text-lg sm:text-xl font-bold text-[#dfe3e3] tracking-wider uppercase truncate">
                {profile.displayName}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-[#00c3ff]/40 text-[#00c3ff] bg-[#00c3ff]/10 chamfer-corner">
                Stage {profile.stage} · {profile.stageLabel}
              </span>
            </div>
            {profile.handle && profile.displayName !== profile.larvaId && (
              <p className="text-xs text-[#839493] font-mono tracking-wider">
                {profile.larvaId}
              </p>
            )}
            <p className="text-xs text-[#839493] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Member since {memberSinceLabel}
            </p>
            <div className="pt-1">
              <FriendRequestButton
                profileId={profile.id}
                relationship={profile.relationship}
                pendingRequestId={profile.pendingRequestId}
                onRelationshipChange={(next) =>
                  setProfile((prev) =>
                    prev
                      ? {
                          ...prev,
                          relationship: next.relationship,
                          pendingRequestId: next.pendingRequestId,
                        }
                      : prev
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
        <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
          <div className="border-b border-[#3a4a49] pb-3">
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00c3ff]" />
              Biometrics
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">Public chassis readings.</p>
          </div>
          {profile.stats ? (
            <ul className="space-y-2">
              {STAT_ROWS.map(({ key, label }) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-xs uppercase tracking-wider text-[#9aa8a7]">{label}</span>
                  <span className="text-sm font-bold text-[#dfe3e3] tabular-nums">
                    {key === 'submergenceDepthRating'
                      ? `${profile.stats![key]} m`
                      : profile.stats![key]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#839493]">No biometric readings on record yet.</p>
          )}

          {profile.moltmax?.score != null && (
            <div className="mt-3 pt-3 border-t border-[#3a4a49] space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[#839493]">Moltmax</div>
              <div className="text-sm text-[#dfe3e3] font-bold">
                Score {profile.moltmax.score}
                {profile.moltmax.clearance ? ` · ${profile.moltmax.clearance}` : ''}
              </div>
              {profile.moltmax.stage && (
                <div className="text-xs text-[#839493]">{profile.moltmax.stage}</div>
              )}
            </div>
          )}
        </div>

        <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
          <div className="border-b border-[#3a4a49] pb-3">
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00c3ff]" />
              Equipped Loadout
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">Read-only hardpoints currently worn.</p>
          </div>
          {loadout && loadout.items.length > 0 ? (
            <>
              <ReadOnlyPaperDoll items={loadout.items} catalogById={catalogById} />
              <LoadoutStatsPanel totals={loadout.totals} variant="strip" />
            </>
          ) : (
            <p className="text-xs text-[#839493] py-6 text-center">No gear equipped yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
