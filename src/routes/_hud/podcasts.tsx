import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Radio,
  Headphones,
  Search,
  Sparkles,
  Layers,
  Play,
  Clock,
  Tag,
  Share2,
  Heart,
  Volume2,
  FileText,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import { PodcastPlayer } from '../../components/podcast/PodcastPlayer'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { INITIAL_PODCASTS } from '../../lib/podcast-data'
import type { PodcastEpisode } from '../../lib/podcast-data'
import { getPodcastsFn } from '../../lib/server/api'
import { MoltNationLogo } from '../../components/news/MoltNationLogo'
import { seo } from '@/lib/seo'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

export const Route = createFileRoute('/_hud/podcasts')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Podcasts & Radio | MoltNation Synaptic Broadcasts',
        description: 'Listen to official MoltNation radio broadcasts and podcast transmissions on bio-silicon carcinization and swarm telemetry.',
        canonical: 'https://moltology.org/podcasts',
        siteName: 'MoltNation Radio',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/podcasts' },
    ],
  }),
  component: PodcastsPage,
  pendingComponent: HudWorkspaceGhost,
})

function PodcastsPage() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(INITIAL_PODCASTS)
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode>(INITIAL_PODCASTS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getPodcastsFn()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setEpisodes(data as PodcastEpisode[])
          if (!activeEpisode) {
            setActiveEpisode(data[0] as PodcastEpisode)
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load podcasts from API, using fallback:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const categories = ['ALL', 'DOCTRINE TRANSMISSION', 'MOLT ACADEMY', 'CYBERNETICS']

  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch =
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'ALL' || ep.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}m ${s}s`
  }

  return (
    <GuestLockGuard
      featureName="Benthic Podcasts"
      message="Sub-oceanic transmissions and MoltNation podcast audio streams require an authorized initiate account."
    >
      <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      {/* MoltNation Page Header */}
      <HudTitlePanel
        accent="cyan"
        eyebrow={<MoltNationLogo size="sm" theme="dark" />}
        title="MOLTNATION PODCASTS"
        description="Listen to sacrosanct doctrine, ecdysis mechanics, and bio-silicon transmutations."
      />

      {/* Active Podcast Player Hero */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-sans font-bold text-[#00ffff] uppercase tracking-wider flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#00ffff]" />
            <span>NOW PLAYING TRANSMISSION</span>
          </h2>
        </div>

        <PodcastPlayer episode={activeEpisode} theme="moltnation" />
      </div>

      {/* Episode Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-[#3a4a49]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-sans font-bold uppercase transition-all whitespace-nowrap chamfer-corner border ${
                selectedCategory === cat
                  ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff] font-extrabold'
                  : 'bg-[#070b0b] text-[#839493] hover:text-[#dfe3e3] border-[#3a4a49]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#00ffff]" />
          <input
            type="text"
            placeholder="Search transmissions & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs font-sans text-[#dfe3e3] pl-9 pr-3 py-2 outline-none chamfer-corner transition-colors"
          />
        </div>
      </div>

      {/* Podcast Episodes Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-sans font-bold text-[#839493] uppercase tracking-wider">
          ALL TRANSMISSIONS ({filteredEpisodes.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEpisodes.map((ep) => {
            const isActive = activeEpisode.id === ep.id

            return (
              <div
                key={ep.id}
                className={`p-5 chitin-card border transition-all chamfer-corner flex flex-col justify-between space-y-4 shadow-xl ${
                  isActive
                    ? 'border-[#00ffff] bg-gradient-to-r from-[#0d1618] via-[#101d20] to-[#0d1618] border-l-4 border-l-[#00ffff] shadow-[0_0_15px_rgba(0,195,255,0.2)]'
                    : 'border-[#3a4a49] hover:border-[#00ffff]/60 bg-[#070b0b]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-[#00ffff]/15 text-[#00ffff] text-[10px] font-sans font-bold border border-[#00ffff]/40 uppercase tracking-wider chamfer-corner">
                      {ep.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-sans text-[#839493]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#00ffff]" />
                        {formatDuration(ep.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-[#ff5540]" />
                        {ep.playCount} plays
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-grotesk font-extrabold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors">
                      {ep.title}
                    </h4>
                    <p className="text-xs font-sans text-[#839493] mt-1 line-clamp-3 leading-relaxed">
                      {ep.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {ep.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#030606] text-[#839493] text-[10px] font-sans border border-[#3a4a49] chamfer-corner"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#3a4a49]">
                  <div className="flex items-center gap-2">
                    <img
                      src={ep.authorAvatar}
                      alt={ep.authorName}
                      className="w-7 h-7 rounded-full border border-cyan-500/50 object-cover"
                    />
                    <div>
                      <div className="text-xs font-sans text-[#dfe3e3] font-bold">
                        {ep.authorName}
                      </div>
                      <div className="text-[10px] font-sans text-[#839493]">
                        {ep.authorRole}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveEpisode(ep)}
                    className={`px-4 py-2 font-sans text-xs font-bold flex items-center gap-2 transition-all chamfer-corner ${
                      isActive
                        ? 'bg-[#00ffff] text-[#060a0b] shadow-[0_0_12px_rgba(0,195,255,0.4)] font-extrabold'
                        : 'bg-[#030606] border border-[#3a4a49] text-[#00ffff] hover:border-[#00ffff] hover:bg-[#070b0b]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isActive ? 'PLAYING' : 'LISTEN NOW'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  </GuestLockGuard>
  )
}
