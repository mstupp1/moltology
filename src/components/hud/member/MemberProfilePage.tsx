import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LocalTime } from '@/components/ui/LocalTime'
import { Link, useNavigate } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import { BonusList, VectorSheetPanel } from '@/components/hud/chassis/VectorSheetPanel'
import { PremiumBadge } from '@/components/hud/PremiumBadge'
import { FriendRequestButton } from './FriendRequestButton'
import { ProfileLinkButton } from './ProfileLinkButton'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { getAuthJWTToken } from '@/lib/jwt'
import { getPublicProfileFn, getMemberLoadoutFn } from '@/lib/server/api'
import type { PublicProfileView } from '@/lib/connections'
import {
  EQUIP_SLOT_IDS,
  EQUIP_SLOT_LABELS,
  RARITY_STYLES,
  gearBonuses,
  type CatalogRef,
  type EquipSlotId,
  type GearItemState,
  type LoadoutTotals,
} from '@/lib/chassis-loadout'
import { buildVectorSheet, emptyVectors, formatBonus, resolveVectorBase, type VectorBase } from '@/lib/vectors'
import {
  equipmentIcon,
  parseLobsterAvatarConfig,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { resolveMemberDossierRedirect } from '@/lib/member-handle'

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
    vectorBase?: VectorBase
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

  const effectiveAvatarConfig = useMemo((): LobsterAvatarConfig | undefined => {
    if (!profile) return undefined
    const parsed = parseLobsterAvatarConfig(profile.avatarConfig)
    if (parsed?.seed) return parsed

    return undefined
  }, [profile])

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
        <div className="rounded-card p-5 border border-crimson-aggro/40 bg-surface-crimson hud-sheen text-crimson-text">
          <h1 className="font-grotesk text-sm font-bold uppercase tracking-[0.08em]">Profile unavailable</h1>
          <p className="text-xs mt-2 text-ink-muted">{error || 'Member not found.'}</p>
          <Link to="/friends" search={{ tab: 'friends' }} className="inline-block mt-4 text-xs text-cyan-glow underline rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
            Back to friends
          </Link>
        </div>
      </div>
    )
  }


  const sheet = buildVectorSheet(
    loadout?.vectorBase ?? resolveVectorBase(null, profile.id),
    loadout?.totals ?? emptyVectors(),
  )
  const isSelf = profile.relationship === 'self'
  const worn = loadout?.items.filter((i) => i.equippedSlot) ?? []
  const auditTaken = sheet.source === 'audit' && profile.moltmax?.score != null

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <section
        aria-labelledby="member-name"
        className="relative overflow-hidden rounded-card border border-line-subtle bg-surface-1 shadow-sheen-inset"
      >
        {/* Quiet depth light behind the portrait; no motion. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(0,195,255,0.14),transparent_55%)]"
        />
        <div className="relative p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <div className="shrink-0 rounded-card bg-abyss/80 p-1.5 ring-1 ring-cyan-glow/30 shadow-[0_0_32px_rgba(0,195,255,0.12)]">
              <LobsterAvatarPortrait
                config={effectiveAvatarConfig}
                className="w-28 h-28 sm:w-36 sm:h-36"
                size={256}
                interactive
                loading="eager"
              />
            </div>
            <div className="min-w-0 flex-1 w-full space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <h1
                    id="member-name"
                    className="font-grotesk text-2xl sm:text-3xl font-extrabold text-ink tracking-tight break-words"
                  >
                    {profile.displayName}
                  </h1>
                  {profile.handle && profile.displayName !== profile.larvaId && (
                    <p className="text-xs text-ink-muted font-mono tracking-wider">{profile.larvaId}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] border border-cyan-glow/40 text-cyan-glow bg-cyan-soft rounded-chip">
                      Stage {profile.stage} · {profile.stageLabel}
                    </span>
                    {profile.isPremium ? <PremiumBadge /> : null}
                  </div>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 shrink-0 max-sm:[&>*]:flex-1">
                  {isSelf && <ProfileLinkButton userId={profile.id} handle={profile.handle} />}
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
              {profile.bio && (
                <p className="text-sm text-ink-body leading-relaxed max-w-prose mx-auto sm:mx-0">{profile.bio}</p>
              )}
              {(profile.traits ?? []).length > 0 && (
                <ul className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                  {(profile.traits ?? []).map((trait) => (
                    <li
                      key={trait.id}
                      className="px-2 py-0.5 text-[11px] font-medium tracking-wide text-ink border border-line-subtle bg-surface-2 rounded-chip"
                    >
                      {trait.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <HeroStat label="Moltmax rating">
              <span className="text-ink">{sheet.rating.base}</span>
              <span className={`ml-1 text-sm ${sheet.rating.gear > 0 ? 'text-cyan-glow' : 'text-ink-muted'}`}>
                ({formatBonus(sheet.rating.gear)})
              </span>
            </HeroStat>
            <HeroStat label="Audit clearance">
              {auditTaken ? (
                <span className="text-ink">{profile.moltmax?.clearance ?? '—'}</span>
              ) : isSelf ? (
                <Link to="/moltmax" className="text-sm text-cyan-glow hover:text-ink">
                  Take the audit
                </Link>
              ) : (
                <span className="text-sm text-ink-muted">Not taken</span>
              )}
            </HeroStat>
            <HeroStat label="Gear worn">
              <span className="text-ink">{worn.length}</span>
              <span className="ml-1 text-sm text-ink-muted">/ {EQUIP_SLOT_IDS.length}</span>
            </HeroStat>
            <HeroStat label="Member since">
              <span className="text-sm text-ink inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                <LocalTime value={profile.memberSince} />
              </span>
            </HeroStat>
          </dl>

          {(profile.joinStory || (profile.bonds ?? []).length > 0) && (
            <div className="border-t border-line-subtle pt-3 flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
              {profile.joinStory && (
                profile.referredBy ? (
                  <Link
                    to="/member/$profileId"
                    params={{ profileId: profile.referredBy.handle || profile.referredBy.id }}
                    className="text-xs text-cyan-glow hover:underline rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {profile.joinStory}
                  </Link>
                ) : (
                  <p className="text-xs text-ink-muted">{profile.joinStory}</p>
                )
              )}
              {(profile.bonds ?? []).map((bond) => (
                <Link
                  key={`${bond.kind}-${bond.memberId}`}
                  to="/member/$profileId"
                  params={{ profileId: bond.memberHandle || bond.memberId }}
                  className="text-xs text-ink-muted hover:text-cyan-glow hover:underline rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  {bond.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        aria-label="Stats and gear"
        className="rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 lg:gap-8"
      >
        <VectorSheetPanel sheet={sheet} self={isSelf} bare hideRating />
        <div className="space-y-3 min-w-0 lg:border-l lg:border-line-subtle lg:pl-8 max-lg:border-t max-lg:border-line-subtle max-lg:pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">Equipped gear</h2>
            {isSelf && (
              <Link to="/character" className="text-xs text-cyan-glow hover:text-ink">
                Change gear
              </Link>
            )}
          </div>
          {worn.length > 0 ? (
            <ul className="divide-y divide-line-subtle">
              {EQUIP_SLOT_IDS.map((slot) => {
                const item = worn.find((i) => i.equippedSlot === slot)
                const cat = item ? catalogById.get(item.catalogItemId) : undefined
                return <GearRow key={slot} slot={slot} catalog={cat} />
              })}
            </ul>
          ) : (
            <p className="text-xs text-ink-muted py-6 text-center">No gear equipped yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function HeroStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-control border border-line-subtle bg-abyss/40 px-3 py-2.5 min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-muted truncate">{label}</dt>
      <dd className="mt-1 font-grotesk text-xl font-bold tabular-nums leading-none truncate">{children}</dd>
    </div>
  )
}

function GearRow({ slot, catalog }: { slot: EquipSlotId; catalog?: CatalogRef }) {
  const icon = catalog ? equipmentIcon(catalog.appearanceKey || catalog.slug) : null
  return (
    <li className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
      <span className="grid place-items-center w-10 h-10 shrink-0 rounded-control bg-abyss/70 border border-line-subtle">
        {icon ? (
          <img src={icon} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <span className="w-4 h-4 rounded-full border border-dashed border-line" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-[0.08em] text-ink-muted">{EQUIP_SLOT_LABELS[slot]}</span>
        {catalog ? (
          <span className={`block text-[13px] font-semibold truncate ${RARITY_STYLES[catalog.rarity].text}`}>
            {catalog.name}
          </span>
        ) : (
          <span className="block text-[13px] text-ink-muted">Empty</span>
        )}
      </span>
      {catalog && <BonusList bonuses={gearBonuses(catalog)} className="shrink-0 text-[12px] text-ink-body text-right" />}
    </li>
  )
}
