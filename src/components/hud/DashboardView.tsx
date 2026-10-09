import React, { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import {
  GitCommit,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react'
import { LaunchpadCarousel } from '@/components/hud/LaunchpadCarousel'
import { HudPromoBentoCard } from '@/components/hud/HudPromoBentoCard'
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { ResumeOracleConsultation } from '@/components/hud/ResumeOracleConsultation'
import { ForumHubCard } from '@/components/hud/ForumHubCard'
import { ConnectionsHubCard } from '@/components/hud/ConnectionsHubCard'
import { ActivityStreamPanel } from '@/components/hud/ActivityStreamPanel'
import { INITIAL_CHANGELOGS, type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogs } from '@/lib/changelogs'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import { PremiumDashboardBanner } from '@/components/hud/PremiumDashboardBanner'

export default function DashboardView() {
  const navigate = useNavigate()
  const [changelogsList, setChangelogsList] = useState<ChangelogEntry[]>(INITIAL_CHANGELOGS)
  const [activeChangelogModal, setActiveChangelogModal] = useState<ChangelogEntry | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadChangelogs() {
      try {
        const fetched = await getPublicChangelogs()
        if (isMounted && fetched && fetched.length > 0) {
          setChangelogsList(fetched)
        }
      } catch {
        // fallback to initial
      }
    }
    loadChangelogs()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      {/* Changelog Detail Modal */}
      {activeChangelogModal && (
        <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-card border border-line bg-surface-1 shadow-menu overflow-hidden font-sans text-sm space-y-4">
            <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-glow" />
                <span className="text-xs text-cyan-glow font-bold tracking-[0.08em] uppercase">
                  RELEASE {activeChangelogModal.version}
                </span>
                <span className="text-xs text-ink-muted bg-surface-1 px-2 py-0.5 border border-line-subtle rounded-chip">
                  {activeChangelogModal.category}
                </span>
                {Array.isArray(activeChangelogModal.tags) &&
                  activeChangelogModal.tags
                    .filter((t) => t.toLowerCase() !== activeChangelogModal.category?.toLowerCase())
                    .map((tag) => (
                      <span key={tag} className="text-[11px] text-cyan-glow bg-cyan-soft px-1.5 py-0.5 border border-line-subtle rounded-chip">
                        {tag}
                      </span>
                    ))}
              </div>
              <button
                onClick={() => setActiveChangelogModal(null)}
                className="rounded-control text-ink-muted hover:text-crimson-text hover:bg-surface-3 p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <h3 className="font-grotesk text-base sm:text-lg font-bold text-ink uppercase leading-snug">
                {activeChangelogModal.title}
              </h3>

              <p className="text-xs text-ink-muted leading-relaxed border-l-2 border-cyan-glow pl-3">
                {activeChangelogModal.summary}
              </p>

              <div className="rounded-card bg-abyss p-4 text-xs leading-relaxed text-ink-body border border-line-subtle">
                <NewsArticleBody content={activeChangelogModal.content} />
              </div>
            </div>

            <div className="bg-surface-2 border-t border-line-subtle p-3 flex items-center justify-between text-xs text-ink-muted">
              <span>
                RELEASED:{' '}
                {new Date(activeChangelogModal.releasedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => setActiveChangelogModal(null)}
                className="px-4 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen text-ink font-bold hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wide Bento Welcome Banner: Benthic Transmissions, Directives & Campaigns */}
      <HudPromoBentoCard />

      <PremiumDashboardBanner />

      <ResumeOracleConsultation />

      {/* Comprehensive Bento Box (6-Directive Rotating Carousel + MoltNation News) */}
      <LaunchpadCarousel />

      {/* Full Daily Alignment Routine & 14-Day Streak Matrix */}
      <DailyRoutineWidget />

      {/* Half-row: Forum + Connections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <ForumHubCard />
        </div>
        <div className="lg:col-span-6 flex flex-col">
          <ConnectionsHubCard />
        </div>
      </div>

      {/* 2-Column Section: Left (Activity Stream) + Right (Changelog & Protocol Releases) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {/* Left Column (7 cols): Member Activity Stream */}
        <div className="lg:col-span-7 flex flex-col">
          <ActivityStreamPanel />
        </div>

        {/* Right Column (5 cols): System Changelog & Releases */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-card border border-line-subtle bg-surface-1 hud-sheen p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-3.5 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-line-subtle pb-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan-glow" />
                  <div>
                    <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">
                      SYSTEM CHANGELOG
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Protocol updates & release history.
                    </p>
                  </div>
                </div>
              </div>

              {/* Changelog Entries Timeline (scrollable) */}
              <div className="relative max-h-[22rem] overflow-y-auto pr-1 -mr-1">
                <div className="relative space-y-2.5 font-sans py-1">
                  {/* Timeline Vertical Track */}
                  <div className="absolute left-2.5 top-3 bottom-3 w-[2px] -translate-x-1/2 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-glow via-cyan-glow/40 to-transparent opacity-60 rounded-full" />
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_6px,rgba(0,195,255,0.3)_6px,rgba(0,195,255,0.3)_7px)]" />
                  </div>

                  {changelogsList.slice(0, 15).map((item) => (
                    <div
                      key={item.version}
                      onClick={() => setActiveChangelogModal(item)}
                      className="relative z-10 pl-7 group cursor-pointer"
                    >
                      {/* Timeline Indicator Node */}
                      <div className="absolute left-2.5 top-3.5 -translate-x-1/2 group-hover:scale-125 transition-transform duration-300">
                        <div className="w-3 h-3 rounded-full bg-abyss border-2 border-cyan-glow relative flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-cyan-glow" />
                        </div>
                      </div>

                      {/* Card Container */}
                      <div className="rounded-card p-3 border border-line-subtle bg-abyss/60 group-hover:bg-surface-2 group-hover:border-line-strong transition-all space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-cyan-glow bg-cyan-soft px-1.5 py-0.2 border border-line-subtle rounded-chip">
                              {item.version}
                            </span>
                            <span className="text-ink-muted bg-surface-1 px-1.5 py-0.2 border border-line-subtle rounded-chip">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-ink-muted text-[11px]">
                            {new Date(item.releasedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                            })}
                          </span>
                        </div>

                        <h4 className="font-grotesk text-xs font-bold text-ink group-hover:text-cyan-glow transition-colors uppercase line-clamp-1 leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="pt-1 border-t border-line-subtle flex items-center justify-between text-[11px] text-ink-muted">
                          <span>CLICK TO INSPECT NOTES</span>
                          <span className="text-cyan-glow font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                            <span>VIEW</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-line-subtle space-y-2">
              <button
                onClick={() => navigate({ to: '/changelog' })}
                className="w-full py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong text-[11px] font-bold font-grotesk text-cyan-glow uppercase tracking-[0.08em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center justify-center gap-1.5"
              >
                <span>VIEW ALL {changelogsList.length} RELEASES</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted text-[11px]">
                  FULL AUDIT LOGS IN SUPPORT HUB
                </span>
                <button
                  onClick={() => navigate({ to: '/support' })}
                  className="px-3 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong text-ink text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow flex items-center gap-1 transition-all"
                >
                  <span>SUPPORT HUB</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


