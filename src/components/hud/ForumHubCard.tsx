import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Clock, MessageSquare } from 'lucide-react'
import { getForumTopicsFn, type ForumTopicEntry } from '@/lib/server/api'
import { relativeTime } from '@/lib/forum-utils'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export const FORUM_HUB_TITLE = 'COMMUNITY FORUMS'
export const FORUM_HUB_SUBTITLE = 'Latest threads from the benthic boards.'
export const FORUM_HUB_EMPTY_COPY = {
  title: 'The boards are quiet',
  body: 'No threads yet. Open the forums to start one.',
} as const

const HUB_THREAD_LIMIT = 3

export type ForumHubThreadView = {
  id: string
  title: string
  slug: string
  categorySlug: string
  categoryName: string
  ageLabel: string
}

export function toForumHubThreads(topics: ForumTopicEntry[], nowLabel = relativeTime): ForumHubThreadView[] {
  return topics.slice(0, HUB_THREAD_LIMIT).map((topic) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    categorySlug: topic.categorySlug || 'general-discussion',
    categoryName: topic.categoryName || 'General Discussion',
    ageLabel: nowLabel(topic.createdAt),
  }))
}

function ForumHubListGhost() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: HUB_THREAD_LIMIT }).map((_, i) => (
        <div key={i} className="chitin-card-inset h-14 border border-[#3a4a49]/50 bg-[#070b0b]/40 chamfer-corner" />
      ))}
    </div>
  )
}

export function ForumHubCard() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<ForumHubThreadView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadThreads() {
      try {
        const fetched = await getForumTopicsFn({ data: { sortBy: 'latest' } })
        if (isMounted) {
          setThreads(toForumHubThreads(Array.isArray(fetched) ? fetched : []))
        }
      } catch {
        if (isMounted) setThreads([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadThreads()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div
      className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3.5 sm:space-y-4 h-full flex flex-col justify-between"
      data-testid="forum-hub-card"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
          <div>
            <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00ffff]" />
              {FORUM_HUB_TITLE}
            </h2>
            <p className="text-xs text-[#839493] mt-0.5">{FORUM_HUB_SUBTITLE}</p>
          </div>
        </div>

        <HudGhostWidget isLoading={isLoading} skeleton={<ForumHubListGhost />}>
          {threads.length === 0 ? (
            <div className="p-6 text-center space-y-1.5">
              <p className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase">
                {FORUM_HUB_EMPTY_COPY.title}
              </p>
              <p className="text-xs text-[#839493] leading-relaxed">{FORUM_HUB_EMPTY_COPY.body}</p>
            </div>
          ) : (
            <div className="space-y-2 font-sans">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  to="/forum/$categorySlug/$topicSlug"
                  params={{ categorySlug: thread.categorySlug, topicSlug: thread.slug }}
                  className="chitin-card-inset p-3 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-all chamfer-corner cursor-pointer group space-y-1.5 bg-[#070b0b]/60 block"
                >
                  <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-snug">
                    {thread.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-[#839493]">
                    <span className="text-[#00ffff] font-bold uppercase tracking-wider bg-[#070b0b] px-1.5 py-0.5 border border-[#3a4a49] truncate max-w-[70%]">
                      {thread.categoryName}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-[#3a4a49] group-hover:text-[#839493] transition-colors" />
                      <span>{thread.ageLabel}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </HudGhostWidget>
      </div>

      <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
        <span className="text-[#839493] text-[10px]">OPEN THE BOARDS</span>
        <button
          type="button"
          onClick={() => navigate({ to: '/forum' })}
          className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
        >
          <span>ENTER FORUMS</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
