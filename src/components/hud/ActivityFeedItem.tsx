import React from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Flame, Layers, MessageSquare, Sparkles, Users } from 'lucide-react'
import { openAlignmentPanel } from '@/lib/alignment-panel'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import {
  ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
  ACTIVITY_EVENT_KIND_DAY_ALIGNED,
  ACTIVITY_EVENT_KIND_FORUM_REPLY_POSTED,
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
    return <Flame className="w-3.5 h-3.5 text-amber-500" />
  }
  if (kind === ACTIVITY_EVENT_KIND_STAGE_REACHED) {
    return <Layers className="w-3.5 h-3.5 text-cyan-glow" />
  }
  if (kind === ACTIVITY_EVENT_KIND_DAY_ALIGNED) {
    return <Sparkles className="w-3.5 h-3.5 text-cyan-glow" />
  }
  if (kind === ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED) {
    return <Users className="w-3.5 h-3.5 text-cyan-glow" />
  }
  if (kind === ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED || kind === ACTIVITY_EVENT_KIND_FORUM_REPLY_POSTED) {
    return <MessageSquare className="w-3.5 h-3.5 text-cyan-glow" />
  }
  if (kind === ACTIVITY_EVENT_KIND_ORACLE_MILESTONE) {
    return <Sparkles className="w-3.5 h-3.5 text-violet-300" />
  }
  return <CheckCircle2 className="w-3.5 h-3.5 text-cyan-glow" />
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
      <Link to="/character/progress" className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'alignment') {
    // Today's tasks live in the avatar menu (the /alignment page is gone), so open it in place.
    // The link still points at the dashboard for new-tab clicks.
    return (
      <Link
        to="/dashboard"
        className={className}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          e.preventDefault()
          openAlignmentPanel()
        }}
      >
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'dashboard') {
    return (
      <Link to="/dashboard" hash={parsed.hash} className={className}>
        {children}
      </Link>
    )
  }
  if (parsed.kind === 'connections') {
    return (
      <Link to="/profile" search={{ tab: 'friends' }} className={className}>
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
        hash={parsed.hash}
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

/**
 * One activity row. Compact is the dashboard's one-line row; full is the Activity page's row,
 * which lets the title and detail wrap instead of cutting them off.
 */
export function ActivityFeedItem({
  event,
  variant = 'full',
  timeLabel,
}: {
  event: ActivityEventView
  variant?: 'compact' | 'full'
  /** Replaces the relative age, e.g. a clock time under a day heading. */
  timeLabel?: string
}) {
  return <ActivityFeedRow event={event} full={variant === 'full'} timeLabel={timeLabel} />
}

/** One line of what happened, one line of who and the detail, time on the right. */
function ActivityFeedRow({
  event,
  full,
  timeLabel,
}: {
  event: ActivityEventView
  full: boolean
  timeLabel?: string
}) {
  const dossier = memberDossierLocation({ id: event.actor.id, handle: event.actor.handle })
  const who = event.isOwn ? 'You' : event.actor.displayName
  // The other stats repeat the title or badge; who a post mentioned is the one new fact.
  const mentioned = full ? activityEventStats(event).find((stat) => stat.label === 'Hailed')?.value : undefined

  return (
    <article
      className={`relative flex items-start gap-3 bg-surface-1 hover:bg-surface-2 transition-colors group ${
        full ? 'px-3 py-3 sm:px-4' : 'px-3 py-2.5'
      }`}
      data-testid="activity-feed-item"
      data-kind={event.kind}
    >
      {event.actor.id ? (
        <Link
          to={dossier.to}
          params={dossier.params}
          className="relative z-10 shrink-0 mt-0.5 rounded-full hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          aria-label={event.actor.displayName}
        >
          <LobsterAvatarPortrait
            config={(event.actor.avatarConfig as LobsterAvatarConfig | null) ?? null}
            className={full ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8'}
            size={full ? 80 : 64}
            fisheyeLens={false}
            vignette={false}
            specularSheen={false}
          />
        </Link>
      ) : (
        <span className={`${full ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-8 h-8'} shrink-0 mt-0.5 rounded-full bg-surface-3 flex items-center justify-center`} aria-hidden="true">
          <KindIcon kind={event.kind} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <EventTitleLink
            event={event}
            className="min-w-0 flex-1 rounded-chip after:absolute after:inset-0 focus-visible:outline-hidden focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-cyan-glow"
          >
            <h3
              className={`text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors leading-snug ${
                full ? 'text-pretty' : 'truncate'
              }`}
            >
              {event.title}
            </h3>
          </EventTitleLink>
          <span className="shrink-0 text-[11px] text-ink-muted tabular-nums">
            {timeLabel ?? event.occurredLabel}
          </span>
        </div>
        <p
          className={`flex gap-1.5 min-w-0 text-xs text-ink-muted leading-relaxed ${
            full ? 'items-start mt-0.5' : 'items-center'
          }`}
        >
          <span className={`shrink-0 [&>svg]:w-3 [&>svg]:h-3 ${full ? 'mt-[0.3rem]' : ''}`} aria-hidden="true">
            <KindIcon kind={event.kind} />
          </span>
          {full ? (
            <span className="min-w-0 flex-1">
              {event.actor.id ? (
                <Link
                  to={dossier.to}
                  params={dossier.params}
                  className="relative z-10 font-bold text-ink-body hover:text-cyan-glow rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  {who}
                </Link>
              ) : (
                <span className="font-bold text-ink-body">{who}</span>
              )}
              <span aria-hidden="true"> · </span>
              <span>{event.detail}</span>
              {mentioned ? <span> Mentioned {mentioned}.</span> : null}
            </span>
          ) : (
            <>
              <span className="shrink-0 font-bold text-ink-body">{who}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{event.detail}</span>
            </>
          )}
          {event.valueBadge ? (
            <span className="ml-auto shrink-0 pl-2 text-[11px] font-bold text-cyan-glow tabular-nums">{event.valueBadge}</span>
          ) : null}
        </p>
      </div>
    </article>
  )
}
