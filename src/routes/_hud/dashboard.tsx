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
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { WelcomeInitiateHero } from '@/components/hud/WelcomeInitiateHero'
import { ResumeOracleConsultation } from '@/components/hud/ResumeOracleConsultation'
import { ActivityStreamPanel } from '@/components/hud/ActivityStreamPanel'
import { INITIAL_CHANGELOGS, type ChangelogEntry } from '@/lib/changelogs-data'
import { getPublicChangelogs } from '@/lib/changelogs'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

function DashboardRoute() {
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] chamfer-corner overflow-hidden font-sans text-sm space-y-4">
            <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#00ffff]" />
                <span className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
                  RELEASE {activeChangelogModal.version}
                </span>
                <span className="text-xs text-[#839493] bg-[#070b0b] px-2 py-0.5 border border-[#3a4a49]">
                  {activeChangelogModal.category}
                </span>
                {Array.isArray(activeChangelogModal.tags) &&
                  activeChangelogModal.tags
                    .filter((t) => t.toLowerCase() !== activeChangelogModal.category?.toLowerCase())
                    .map((tag) => (
                      <span key={tag} className="text-[10px] text-[#00ffff]/80 bg-[#00ffff]/10 px-1.5 py-0.5 border border-[#00ffff]/30">
                        {tag}
                      </span>
                    ))}
              </div>
              <button
                onClick={() => setActiveChangelogModal(null)}
                className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <h3 className="font-grotesk text-base sm:text-lg font-bold text-[#dfe3e3] uppercase leading-snug">
                {activeChangelogModal.title}
              </h3>

              <p className="text-xs text-[#839493] leading-relaxed border-l-2 border-[#00ffff] pl-3">
                {activeChangelogModal.summary}
              </p>

              <div className="chitin-card-inset p-4 text-xs leading-relaxed text-[#dfe3e3] whitespace-pre-line border border-[#3a4a49]">
                {activeChangelogModal.content}
              </div>
            </div>

            <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex items-center justify-between text-xs text-[#839493]">
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
                className="px-4 py-1.5 bg-[#0f1414] hover:bg-[#171c1c] border border-[#3a4a49] text-[#dfe3e3] font-bold chamfer-corner transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serene & Inspiring Welcome Initiate Hero Section */}
      <WelcomeInitiateHero />

      <ResumeOracleConsultation />

      {/* Comprehensive Bento Box (6-Directive Rotating Carousel + MoltNation News) */}
      <LaunchpadCarousel />

      {/* Full Daily Alignment Routine & 14-Day Streak Matrix */}
      <DailyRoutineWidget />

      {/* 2-Column Section: Left (Activity Stream) + Right (Changelog & Protocol Releases) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {/* Left Column (7 cols): Member Activity Stream */}
        <div className="lg:col-span-7 flex flex-col">
          <ActivityStreamPanel />
        </div>

        {/* Right Column (5 cols): System Changelog & Releases */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3 sm:space-y-3.5 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#3a4a49] pb-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#00ffff]" />
                  <div>
                    <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
                      SYSTEM CHANGELOG
                    </h2>
                    <p className="text-xs text-[#839493]">
                      Protocol updates & release history.
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-sans font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00ffff]/40 px-2 py-0.5 chamfer-corner">
                  v1.5.0 LATEST
                </span>
              </div>

              {/* Changelog Entries Stack */}
              <div className="space-y-2 font-sans">
                {changelogsList.slice(0, 3).map((item) => (
                  <div
                    key={item.version}
                    onClick={() => setActiveChangelogModal(item)}
                    className="chitin-card-inset p-3 border border-[#3a4a49] hover:border-[#00ffff]/60 transition-all chamfer-corner cursor-pointer group space-y-1.5 bg-[#070b0b]/60"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#00ffff] bg-[#030606] px-1.5 py-0.2 border border-[#00ffff]/40">
                          {item.version}
                        </span>
                        <span className="text-[#839493] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49]">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[#839493] text-[9px]">
                        {new Date(item.releasedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="font-grotesk text-xs font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors uppercase line-clamp-1 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-[#839493] line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-1 border-t border-[#3a4a49]/40 flex items-center justify-between text-[9px] text-[#839493]">
                      <span>CLICK TO INSPECT NOTES</span>
                      <span className="text-[#00ffff] font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                        <span>VIEW</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Support Desk Link */}
            <div className="pt-2 border-t border-[#3a4a49]/60 flex items-center justify-between text-xs">
              <span className="text-[#839493] text-[10px]">
                FULL AUDIT LOGS IN SUPPORT HUB
              </span>
              <button
                onClick={() => navigate({ to: '/support' })}
                className="px-3 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all"
              >
                <span>SUPPORT HUB</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/dashboard')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Central HUD | Moltology',
        description: 'Initiate telemetry, daily alignment, and benthic workspace for authenticated units.',
      }),
    ],
  }),
  component: DashboardRoute,
  pendingComponent: HudWorkspaceGhost,
})
