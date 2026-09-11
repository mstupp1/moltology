import React from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Clock, Flame, Layers, MessageSquare, Sparkles, Users } from 'lucide-react'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import {
  ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
  ACTIVITY_EVENT_KIND_DAY_ALIGNED,
  ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED,
  ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
  ACTIVITY_EVENT_KIND_STAGE_REACHED,
  ACTIVITY_EVENT_KIND_STREAK_MILESTONE,
  activityEventStats,
  parseActivityEventHref,
  type ActivityEventView,
} from '@/lib/activity-events'
import { memberDossierLocation } from '@/lib/member-handle'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

function KindIcon({ kind }: { kind: string }) {
  if (kind === ACTIVITY_EVENT_KIND_STREAK_MILESTONE) {
    return <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
  }
  if (kind === ACTIVITY_EVENT_KIND_STAGE_REACHED) {
    return <Layers className="w-3.5 h-3.5 text-[#00c3ff]" />
  }
  if (kind === ACTIVITY_EVENT_KIND_DAY_ALIGNED) {
    return <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />
  }
  if (kind === ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED) {
    return <Users className="w-3.5 h-3.5 text-[#00ffff]" />
  }
  if (kind === ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED) {
    return <MessageSquare className="w-3.5 h-3.5 text-[#00ffff]" />
  }
  if (kind === ACTIVITY_EVENT_KIND_ORACLE_MILESTONE) {
    return <Sparkles className="w-3.5 h-3.5 text-[#c4b5fd]" />
  }
  return <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff]" />
}

function EventTitleLink({
  event,
  className,
  children,
}: {
  event: ActivityEventView
  className?: string
  children: React.ReactNode
}) {
  const parsed = parseActivityEventHref(event.href)
  if (parsed.kind === 'pipeline') {
    return (
      <Link to="/pipeline" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'dashboard') {
    return (
      <Link to="/dashboard" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'connections') {
    return (
      <Link to="/connections" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'oracle') {
    return (
      <Link to="/oracle" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'forum') {
    return (
      <Link to="/forum" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'forum-board') {
    return (
      <Link to="/forum/$categorySlug" params={{ categorySlug: parsed.categorySlug }} className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'forum-topic') {
    return (
      <Link
        to="/forum/$categorySlug/$topicSlug"
        params={{ categorySlug: parsed.categorySlug, topicSlug: parsed.topicSlug }}
        className={className}
      >
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'member') {
    return (
      <Link to="/member/$profileId" params={{ profileId: parsed.profileId }} className={className}>
        {children}
      </Link>
    )
  }
  const dossier = memberDossierLocation({
    id: event.actor.id,
    handle: event.actor.handle,
  })
  return (
    <Link to={dossier.to} params={dossier.params} className={className}>
      {children}
    </Link>
  )
}

function kindAccent(kind: string): string {
  if (kind === ACTIVITY_EVENT_KIND_STREAK_MILESTONE) return 'border-[#f59e0b]/45'
  if (kind === ACTIVITY_EVENT_KIND_STAGE_REACHED) return 'border-[#00c3ff]/45'
  if (kind === ACTIVITY_EVENT_KIND_DAY_ALIGNED) return 'border-[#00ffff]/40'
  if (kind === ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED) return 'border-[#00ffff]/45'
  if (kind === ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED) return 'border-[#00ffff]/40'
  if (kind === ACTIVITY_EVENT_KIND_ORACLE_MILESTONE) return 'border-[#c4b5fd]/40'
  return 'border-[#3a4a49]'
}

export function ActivityFeedItem({
  event,
  variant = 'full',
}: {
  event: ActivityEventView
  variant?: 'compact' | 'full'
}) {
  const stats = activityEventStats(event)
  const dossier = memberDossierLocation({
    id: event.actor.id,
    handle: event.actor.handle,
  })
  const compact = variant === 'compact'

  return (
    <article
      className={`chitin-card-inset p-2.5 sm:p-3 border transition-colors chamfer-corner bg-[#070b0b]/60 hover:border-[#00ffff]/50 ${kindAccent(event.kind)}`}
      data-testid="activity-feed-item"
      data-kind={event.kind}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {event.actor.id ? (
          <Link
            to={dossier.to}
            params={dossier.params}
            className="shrink-0 mt-0.5 hover:opacity-90"
            aria-label={event.actor.displayName}
          >
            <LobsterAvatarPortrait
              config={(event.actor.avatarConfig as LobsterAvatarConfig | null) ?? null}
              className={compact ? 'w-8 h-8' : 'w-10 h-10'}
              size={compact ? 64 : 96}
              eyeTracking={false}
              fisheyeLens={false}
              vignette={false}
              specularSheen={false}
            />
          </Link>
        ) : (
          <div className="p-1.5 bg-[#070b0b] border border-[#3a4a49] shrink-0 mt-0.5">
            <KindIcon kind={event.kind} />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  to={dossier.to}
                  params={dossier.params}
                  className="text-[11px] font-bold text-[#dfe3e3] hover:text-[#00ffff] truncate"
                >
                  {event.isOwn ? 'You' : event.actor.displayName}
                </Link>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.5 shrink-0">
                  {event.categoryLabel}
                </span>
                {event.isOwn && !compact ? (
                  <span className="text-[9px] text-[#839493] border border-[#3a4a49] px-1.5 py-0.5">You</span>
                ) : null}
              </div>
              <EventTitleLink event={event} className="block">
                <h3
                  className={`font-grotesk font-bold text-[#dfe3e3] leading-snug ${
                    compact ? 'text-xs line-clamp-1' : 'text-sm'
                  }`}
                >
                  {event.title}
                </h3>
              </EventTitleLink>
            </div>
            {event.valueBadge ? (
              <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#070b0b] border border-[#3a4a49] px-1.5 py-0.5 shrink-0 tabular-nums">
                {event.valueBadge}
              </span>
            ) : null}
          </div>

          <p className={`text-[11px] text-[#839493] leading-snug ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
            {event.detail}
          </p>

          {!compact && stats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {stats.map((stat) => (
                <span
                  key={`${stat.label}-${stat.value}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-[#3a4a49] bg-[#050808]/80 text-[#839493] chamfer-corner"
                >
                  <span className="uppercase tracking-wider">{stat.label}</span>
                  <span className="text-[#dfe3e3] font-bold tabular-nums">{stat.value}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="text-[10px] text-[#3a4a49] flex items-center gap-1 pt-0.5">
            <Clock className="w-3 h-3" />
            <span>{event.occurredLabel}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
